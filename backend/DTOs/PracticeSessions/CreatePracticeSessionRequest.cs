using System.ComponentModel.DataAnnotations;

namespace GolfPracticeAnalyzer.Api.DTOs.PracticeSessions;

// the data needed to create one practice session and its shots
public class CreatePracticeSessionRequest
{
    [Required]
    [StringLength(150)]
    public string? Name { get; set; }

    [Required]
    public DateOnly? PracticeDate { get; set; }

    // At least one shot is required when creating a practice session
    [Required]
    [MinLength(1)]
    public List<CreateShotRequest>? Shots { get; set; }
}

// The client supplies shot data, but not the owner or shot number
public class CreateShotRequest
{
    [Required]
    [StringLength(50)]
    public string? Club { get; set; }

    // Nullable fields allow validation to distinguish a missing value from 0
    [Required]
    [Range(typeof(decimal), "0.001", "9999999.999", ParseLimitsInInvariantCulture = true)]
    public decimal? Carry { get; set; }

    // A value of 0 is valid, the ball landed on the target line
    [Required]
    [Range(typeof(decimal), "-9999999.999", "9999999.999", ParseLimitsInInvariantCulture = true)]
    public decimal? CarrySide { get; set; }

    [Range(typeof(decimal), "0", "9999999.999", ParseLimitsInInvariantCulture = true)]
    public decimal? BallSpeed { get; set; }

    [Range(typeof(decimal), "-9999999.999", "9999999.999", ParseLimitsInInvariantCulture = true)]
    public decimal? LaunchAngle { get; set; }

    [Range(typeof(decimal), "0", "9999999.999", ParseLimitsInInvariantCulture = true)]
    public decimal? PeakHeight { get; set; }

    [Range(typeof(decimal), "0", "9999999.999", ParseLimitsInInvariantCulture = true)]
    public decimal? TotalDistance { get; set; }
}