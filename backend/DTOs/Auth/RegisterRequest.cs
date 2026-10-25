using System.ComponentModel.DataAnnotations;

namespace GolfPracticeAnalyzer.Api.DTOs.Auth;

public class RegisterRequest
{
    // Require a non-empty email address in a valid format
    [Required]
    [EmailAddress]
    public required string Email { get; set;}

    // Match the minimun length configured in Identity
    // Identity performs its own password validation when creating the user
    [Required]
    [MinLength(12)]
    public required string Password { get; set;}
}