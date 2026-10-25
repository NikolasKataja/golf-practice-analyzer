using System.ComponentModel.DataAnnotations;

namespace GolfPracticeAnalyzer.Api.DTOs.Auth;

public class DeleteAccountRequest
{
    // Require the current password to confirm account deletion
    // The controller will determine the user from the signed-in session
    [Required]
    public required string Password { get; set; }
}