using System.ComponentModel.DataAnnotations;

namespace GolfPracticeAnalyzer.Api.DTOs.Auth;

public class LoginRequest
{
    // The user signs in with their email address
    [Required]
    [EmailAddress]
    [StringLength(256)]
    public required string Email { get; set; }

    // Check the actual password through Identity, not through this DTO
    [Required]
    public required string Password { get; set; }
}