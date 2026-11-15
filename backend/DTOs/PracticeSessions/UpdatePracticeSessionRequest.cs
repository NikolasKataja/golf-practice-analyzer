using System.ComponentModel.DataAnnotations;

namespace GolfPracticeAnalyzer.Api.DTOs.PracticeSessions;

public class UpdatePracticeSessionRequest
{
    [Required]
    [StringLength(150)]
    public string? Name { get; set; }

    [Required]
    public DateOnly? PracticeDate { get; set; }
}