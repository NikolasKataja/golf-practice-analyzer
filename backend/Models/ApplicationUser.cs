using Microsoft.AspNetCore.Identity;

namespace GolfPracticeAnalyzer.Api.Models;

// Inherit Identity's user properties, including Id, Email and PasswordHash.
public class ApplicationUser : IdentityUser
{
    // Navigation property: the practice sessions owned by this user.
    // An empty collection allows a new user to have no sessions.
    public ICollection<PracticeSession> PracticeSessions { get; set;}
        = new List<PracticeSession>();
}