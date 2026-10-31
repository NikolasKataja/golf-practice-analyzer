using System.Globalization;
using System.Text;
using CsvHelper;
using CsvHelper.Configuration;
using GolfPracticeAnalyzer.Api.Models;

namespace GolfPracticeAnalyzer.Api.Services;

public class SwingSyncCsvReader
{
    // These columns must exist, even when optional metric values are empty.
    private static readonly string[] RequiredHeaders =
    [
        "Shot number",
        "Date",
        "Club type",
        "Carry",
        "Offline carry",
        "Ball speed",
        "Vertical Launch angle",
        "Peak height",
        "Total"
    ];

    // Accept only the units supported by this version of the importer.
    private static readonly Dictionary<string, string> ExpectedUnits = new()
    {
        ["Carry"] = "[m]",
        ["Offline carry"] = "[m]",
        ["Ball speed"] = "[kph]",
        ["Vertical Launch angle"] = "[°]",
        ["Peak height"] = "[m]",
        ["Total"] = "[m]"
    };

    public async Task<List<Shot>> ReadAsync(Stream stream)
    {
        // Decimal points must be interpreted independently of local settings.
        var configuration = new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            Delimiter = ",",
            HasHeaderRecord = true,
            IgnoreBlankLines = true,
            DetectColumnCountChanges = true
        };

        // Leave the uploaded stream open; its caller owns its lifetime.
        using var reader = new StreamReader(
            stream,
            new UTF8Encoding(false, true),
            detectEncodingFromByteOrderMarks: true,
            bufferSize: 1024,
            leaveOpen: true
        );

        using var csv = new CsvReader(reader, configuration);

        try
        {
            if (!await csv.ReadAsync())
            {
                throw new FormatException("The CSV file is empty.");
            }

            csv.ReadHeader();

            var headers = csv.HeaderRecord
                ?? throw new FormatException("The header row is missing.");

            // Duplicate names would make column selection ambiguous.
            if (headers.Distinct(StringComparer.Ordinal).Count() != headers.Length)
            {
                throw new FormatException(
                    "The CSV file contains duplicate column names."
                );
            }

            foreach (var header in RequiredHeaders)
            {
                if (!headers.Contains(header, StringComparer.Ordinal))
                {
                    throw new FormatException(
                        $"The required column '{header}' is missing."
                    );
                }
            }

            if (!await csv.ReadAsync())
            {
                throw new FormatException("The units row is missing.");
            }

            foreach (var (column, expectedUnit) in ExpectedUnits)
            {
                if (ReadText(csv, column) != expectedUnit)
                {
                    throw new FormatException(
                        $"Column '{column}' must use the unit '{expectedUnit}'."
                    );
                }
            }

            var shots = new List<Shot>();
            var shotNumbers = new HashSet<int>();

            while (await csv.ReadAsync())
            {
                var numberText = ReadText(csv, "Shot number");

                if (!int.TryParse(
                        numberText,
                        NumberStyles.None,
                        CultureInfo.InvariantCulture,
                        out var shotNumber)
                    || shotNumber <= 0)
                {
                    throw RowError(
                        csv, "Shot number", "must be a positive integer."
                    );
                }

                if (!shotNumbers.Add(shotNumber))
                {
                    throw RowError(
                        csv, "Shot number", "must be unique within the file."
                    );
                }

                var club = ReadText(csv, "Club type");

                if (string.IsNullOrWhiteSpace(club) || club.Length > 50)
                {
                    throw RowError(
                        csv, "Club type", "must contain 1–50 characters."
                    );
                }

                var dateText = ReadText(csv, "Date");

                // This importer supports the UTC timestamps in the sample file.
                if (!DateTimeOffset.TryParseExact(
                        dateText,
                        "yyyy-MM-dd'T'HH:mm:ss.FFFFFFF'Z'",
                        CultureInfo.InvariantCulture,
                        DateTimeStyles.AssumeUniversal
                            | DateTimeStyles.AdjustToUniversal,
                        out var shotAt))
                {
                    throw RowError(
                        csv, "Date", "must be a valid UTC timestamp ending in Z."
                    );
                }

                var carry = ReadDecimal(csv, "Carry", required: true)!.Value;

                if (carry <= 0)
                {
                    throw RowError(csv, "Carry", "must be greater than zero.");
                }

                shots.Add(new Shot
                {
                    ShotNumber = shotNumber,
                    ShotAt = shotAt.UtcDateTime,
                    Club = club,
                    Carry = carry,
                    CarrySide = ReadCarrySide(csv),
                    BallSpeed = ReadDecimal(csv, "Ball speed"),
                    LaunchAngle = ReadDecimal(
                        csv, "Vertical Launch angle", allowNegative: true
                    ),
                    PeakHeight = ReadDecimal(csv, "Peak height"),
                    TotalDistance = ReadDecimal(csv, "Total")
                });
            }

            if (shots.Count == 0)
            {
                throw new FormatException("The CSV file contains no shots.");
            }

            return shots;
        }
        catch (CsvHelperException)
        {
            // Do not expose CsvHelper's raw record data in API error messages.
            throw new FormatException(
                $"Invalid CSV structure near row {csv.Parser.Row}."
            );
        }
        catch (DecoderFallbackException)
        {
            throw new FormatException(
                "The CSV file contains invalid text encoding."
            );
        }
    }

    private static string ReadText(CsvReader csv, string column)
    {
        return (csv.GetField(column) ?? string.Empty).Trim();
    }

    private static decimal? ReadDecimal(
        CsvReader csv,
        string column,
        bool required = false,
        bool allowNegative = false)
    {
        var text = ReadText(csv, column);

        if (text.Length == 0)
        {
            if (required)
            {
                throw RowError(csv, column, "is required.");
            }

            // Missing optional metrics remain null, not zero.
            return null;
        }

        return ParseDecimal(csv, column, text, allowNegative);
    }

    private static decimal ParseDecimal(
        CsvReader csv,
        string column,
        string text,
        bool allowNegative)
    {
        // Do not allow thousands separators or culture-dependent formats.
        var styles = NumberStyles.AllowLeadingSign
            | NumberStyles.AllowDecimalPoint;

        if (!decimal.TryParse(
                text, styles, CultureInfo.InvariantCulture, out var value))
        {
            throw RowError(
                csv, column, "must be a number with a decimal point."
            );
        }

        var minimum = allowNegative ? -9999999.999m : 0m;

        if (value < minimum || value > 9999999.999m)
        {
            throw RowError(csv, column, "is outside the supported range.");
        }

        // Prevent the database from silently rounding imported values.
        if (decimal.Round(value, 3) != value)
        {
            throw RowError(
                csv, column, "must have no more than three decimal places."
            );
        }

        return value;
    }

    private static decimal ReadCarrySide(CsvReader csv)
    {
        var text = ReadText(csv, "Offline carry");

        // A plain zero is unambiguous without a direction.
        if (text == "0")
        {
            return 0m;
        }

        if (text.EndsWith(" L", StringComparison.Ordinal))
        {
            return -ParseDecimal(
                csv, "Offline carry", text[..^2].Trim(), allowNegative: false
            );
        }

        if (text.EndsWith(" R", StringComparison.Ordinal))
        {
            return ParseDecimal(
                csv, "Offline carry", text[..^2].Trim(), allowNegative: false
            );
        }

        throw RowError(
            csv,
            "Offline carry",
            "must contain a distance followed by L or R, or be 0."
        );
    }

    private static FormatException RowError(
        CsvReader csv,
        string column,
        string message)
    {
        return new FormatException(
            $"Row {csv.Parser.Row}, column '{column}': {message}"
        );
    }
}
