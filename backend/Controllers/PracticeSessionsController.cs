using GolfPracticeAnalyzer.Api.Data;
using GolfPracticeAnalyzer.Api.DTOs.PracticeSessions;
using GolfPracticeAnalyzer.Api.Models;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace GolfPracticeAnalyzer.Api.Controllers;

[ApiController]
[Authorize]
[Route("practice-sessions")]
public class PracticeSessionsController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IAntiforgery _antiforgery;

    public PracticeSessionsController(
        AppDbContext dbContext,
        UserManager<ApplicationUser> userManager,
        IAntiforgery antiforgery)
    {
        _dbContext = dbContext;
        _userManager = userManager;
        _antiforgery = antiforgery;
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        CreatePracticeSessionRequest request
    )
    {
        // validate the request token against the CSRF cookie
        try
        {
            await _antiforgery.ValidateRequestAsync(HttpContext);
        }
        catch (AntiforgeryValidationException)
        {
            return BadRequest("Invalid CSRF token.");
        }

        // Resolve the owner from the authenticated identity, never from input
        var user = await _userManager.GetUserAsync(User);

        if (user == null)
        {
            return Unauthorized();
        }

        // Required and length validation is handled by [ApiController]
        // Trim text before storing it to avoid unnecessary whitespace
        var session = new PracticeSession
        {
            UserId = user.Id,
            Name = request.Name!.Trim(),
            PracticeDate = request.PracticeDate!.Value
        };

        for (var index = 0; index < request.Shots!.Count; index++)
        {
            var shotRequest = request.Shots[index];

            // Add shots through the navigation property so EF Core links
            // them to the new session when both are saved.
            session.Shots.Add(new Shot
            {ShotNumber = index + 1,
                Club = shotRequest.Club!.Trim(),
                Carry = shotRequest.Carry!.Value,
                CarrySide = shotRequest.CarrySide!.Value,
                BallSpeed = shotRequest.BallSpeed,
                LaunchAngle = shotRequest.LaunchAngle,
                PeakHeight = shotRequest.PeakHeight,
                TotalDistance = shotRequest.TotalDistance
            });
        }

        _dbContext.PracticeSessions.Add(session);

        // Save the session along with its shots to the database
        await _dbContext.SaveChangesAsync();

        return StatusCode(StatusCodes.Status201Created, new
        {
            session.Id,
            session.Name,
            session.PracticeDate,
            ShotCount = session.Shots.Count
        });
    }
}