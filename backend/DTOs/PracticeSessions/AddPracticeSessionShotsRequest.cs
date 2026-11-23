using System.ComponentModel.DataAnnotations;

namespace GolfPracticeAnalyzer.Api.DTOs.PracticeSessions;

public class AddPracticeSessionShotsRequest
{
    [Required]
    [MinLength(1)]
    public List<CreateShotRequest>? Shots { get; set; }
}
