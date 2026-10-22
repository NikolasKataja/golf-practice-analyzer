namespace GolfPracticeAnalyzer.Api.Models;

public class Shot
{
    // Primary key for this individual shot.
    public int Id { get; set; }

    // Foreign key linking the shot to its practice session.
    public int PracticeSessionId { get; set; }

    // Navigation property for accessing the related session.
    public PracticeSession PracticeSession { get; set; } = null!;

    // The shot's sequence number within its session.
    public int ShotNumber { get; set; }

    // Optional shot timestamp. The ? allows the value to be null.
    public DateTime? ShotAt { get; set; }

    // The club used for the shot.
    public required string Club { get; set; }

    // Required carry distance in metres.
    public decimal Carry { get; set; }

    // Required lateral deviation at carry, in metres.
    // Negative values indicate left; positive values indicate right.
    public decimal CarrySide { get; set; }

    // Optional metrics. Null means the value was not provided.
    public decimal? BallSpeed { get; set; }
    public decimal? LaunchAngle { get; set; }
    public decimal? PeakHeight { get; set; }
    public decimal? TotalDistance { get; set; }
}