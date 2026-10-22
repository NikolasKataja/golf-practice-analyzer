namespace GolfPracticeAnalyzer.Api.Models;

public class PracticeSession
{
    // Primary key. EF Core recognizes the name "Id" by convention.
    public int Id { get; set; }

    // Foreign key linking this session to its owner.
    public required string UserId { get; set; }

    // Navigation property for accessing the owner.
    // null! suppresses the compiler warning; EF Core can populate this
    // property when the related user is loaded.
    public ApplicationUser User { get; set; } = null!;
    
    // A descriptive name entered by the user.
    public required string Name { get; set; }

    // The date of the practice, without a time of day.    public DateOnly PracticeDate { get; set; }
    public DateOnly PracticeDate { get; set; }

    // The time this record was created, stored using UTC.
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;


    // Navigation property: the shots belonging to this session.
    public ICollection<Shot> Shots { get; set; } 
        = new List<Shot>();
}