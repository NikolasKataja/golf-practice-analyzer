using GolfPracticeAnalyzer.Api.Data;
using GolfPracticeAnalyzer.Api.DTOs.PracticeSessions;
using GolfPracticeAnalyzer.Api.Models;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using GolfPracticeAnalyzer.Api.Services;

namespace GolfPracticeAnalyzer.Api.Controllers;

[ApiController]
[Authorize]
[Route("practice-sessions")]
public class PracticeSessionsController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IAntiforgery _antiforgery;
    private readonly SwingSyncCsvReader _csvReader;

    public PracticeSessionsController(
    AppDbContext dbContext,
    UserManager<ApplicationUser> userManager,
    IAntiforgery antiforgery,
    SwingSyncCsvReader csvReader
)
{
    _dbContext = dbContext;
    _userManager = userManager;
    _antiforgery = antiforgery;
    _csvReader = csvReader;
}

    [HttpPost]
    public async Task<IActionResult> Create(
        CreatePracticeSessionRequest request
    )
    {
        // validate the request token against the CSRF cookie
        try
        {
            await _antiforgery.ValidateRequestAsync(HttpContext);
        }
        catch (AntiforgeryValidationException)
        {
            return BadRequest("Invalid CSRF token.");
        }

        // Resolve the owner from the authenticated identity, never from input
        var user = await _userManager.GetUserAsync(User);

        if (user == null)
        {
            return Unauthorized();
        }

        // Required and length validation is handled by [ApiController]
        // Trim text before storing it to avoid unnecessary whitespace
        var session = new PracticeSession
        {
            UserId = user.Id,
            Name = request.Name!.Trim(),
            PracticeDate = request.PracticeDate!.Value
        };

        for (var index = 0; index < request.Shots!.Count; index++)
        {
            var shotRequest = request.Shots[index];

            // Add shots through the navigation property so EF Core links
            // them to the new session when both are saved.
            session.Shots.Add(new Shot
            {ShotNumber = index + 1,
                Club = shotRequest.Club!.Trim(),
                Carry = shotRequest.Carry!.Value,
                CarrySide = shotRequest.CarrySide!.Value,
                BallSpeed = shotRequest.BallSpeed,
                LaunchAngle = shotRequest.LaunchAngle,
                PeakHeight = shotRequest.PeakHeight,
                TotalDistance = shotRequest.TotalDistance
            });
        }

        _dbContext.PracticeSessions.Add(session);

        // Save the session along with its shots to the database
        await _dbContext.SaveChangesAsync();

        return StatusCode(StatusCodes.Status201Created, new
        {
            session.Id,
            session.Name,
            session.PracticeDate,
            ShotCount = session.Shots.Count
        });
    }

    [HttpPost("import/preview")]
[RequestSizeLimit(2 * 1024 * 1024)]
public async Task<IActionResult> PreviewImport([FromForm] IFormFile file)
{
    // Validate the token sent with the uploaded file.
    try
    {
        await _antiforgery.ValidateRequestAsync(HttpContext);
    }
    catch (AntiforgeryValidationException)
    {
        return BadRequest(new { message = "Invalid CSRF token." });
    }

    var user = await _userManager.GetUserAsync(User);

    if (user is null)
    {
        return Unauthorized();
    }

    if (file.Length == 0)
    {
        return BadRequest(new { message = "The uploaded file is empty." });
    }

    // The extension is a usability check; the reader validates the content.
    if (!string.Equals(
            Path.GetExtension(file.FileName),
            ".csv",
            StringComparison.OrdinalIgnoreCase))
    {
        return BadRequest(new { message = "Please select a CSV file." });
    }

    try
    {
        using var stream = file.OpenReadStream();

        var shots = await _csvReader.ReadAsync(stream);

        // Return selected fields instead of complete EF Core entities.
        // This preview does not add anything to the database.
        return Ok(new
        {
            shotCount = shots.Count,
            clubs = shots.Select(shot => shot.Club).Distinct().ToList(),
            shots = shots.Select(shot => new
            {
                shot.ShotNumber,
                shot.ShotAt,
                shot.Club,
                shot.Carry,
                shot.CarrySide,
                shot.BallSpeed,
                shot.LaunchAngle,
                shot.PeakHeight,
                shot.TotalDistance
            }).ToList()
        });
    }
    catch (FormatException exception)
    {
        // The reader provides controlled messages with row and column details.
        return BadRequest(new { message = exception.Message });
    }
}
}