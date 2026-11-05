using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace GolfPracticeAnalyzer.Api.DTOs.PracticeSessions;

public class ImportPracticeSessionRequest
{
    [Required]
    [StringLength(150)]
    public string? Name { get; set; }

    [Required]
    public DateOnly? PracticeDate { get; set; }

    [Required]
    public IFormFile? File { get; set; }
}