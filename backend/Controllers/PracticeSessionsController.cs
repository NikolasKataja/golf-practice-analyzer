using GolfPracticeAnalyzer.Api.Data;
using GolfPracticeAnalyzer.Api.DTOs.PracticeSessions;
using Microsoft.EntityFrameworkCore;
using GolfPracticeAnalyzer.Api.Models;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using GolfPracticeAnalyzer.Api.Services;
using System.Data;
using Microsoft.EntityFrameworkCore.Storage;

namespace GolfPracticeAnalyzer.Api.Controllers;

[ApiController]
[Authorize]
[Route("practice-sessions")]
public class PracticeSessionsController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IAntiforgery _antiforgery;
    private readonly SwingSyncCsvReader _csvReader;

    public PracticeSessionsController(
    AppDbContext dbContext,
    UserManager<ApplicationUser> userManager,
    IAntiforgery antiforgery,
    SwingSyncCsvReader csvReader
    )

    {
        _dbContext = dbContext;
        _userManager = userManager;
        _antiforgery = antiforgery;
        _csvReader = csvReader;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        CancellationToken cancellationToken
    )
    {
        // Resolve the owner from the autenticated identity
        var user = await _userManager.GetUserAsync(User);

        if (user == null)
        {
            return Unauthorized();
        }

        // Filter by owner before selecting the data returned to the client
        var sessions = await _dbContext.PracticeSessions
            .AsNoTracking()
            .Where(session => session.UserId == user.Id)
            .OrderByDescending(session => session.PracticeDate)
            .ThenByDescending(session => session.Id)
            .Select(session => new
            {
                session.Id,
                session.Name,
                session.PracticeDate,
                ShotCount = session.Shots.Count
            })
            .ToListAsync(cancellationToken);

        // Prevent the browser from caching this response
        Response.Headers.CacheControl = "no-store";

        return Ok(sessions);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(
    int id,
    CancellationToken cancellationToken
)
    {
        var user = await _userManager.GetUserAsync(User);

        if (user is null)
        {
            return Unauthorized();
        }

        // Check both the session ID and ownership in the database query.
        var session = await _dbContext.PracticeSessions
            .AsNoTracking()
            .Where(session => session.Id == id && session.UserId == user.Id)
            .Select(session => new
            {
                session.Id,
                session.Name,
                session.PracticeDate,
                Shots = session.Shots
                    .OrderBy(shot => shot.ShotNumber)
                    .Select(shot => new
                    {
                        shot.Id,
                        shot.ShotNumber,
                        shot.ShotAt,
                        shot.Club,
                        shot.Carry,
                        shot.CarrySide,
                        shot.BallSpeed,
                        shot.LaunchAngle,
                        shot.PeakHeight,
                        shot.TotalDistance
                    })
                    .ToList()
            })
            .SingleOrDefaultAsync(cancellationToken);

        // Do not cache user-specific practice data.
        Response.Headers.CacheControl = "no-store";

        // Use the same response for a missing session and another user's session.
        if (session is null)
        {
            return NotFound(new { message = "Practice session not found." });
        }

        return Ok(session);
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
            return BadRequest(new { message = "Invalid CSRF token." });
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
            {
                ShotNumber = index + 1,
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

    [HttpPost("{id:int}/shots")]
    public async Task<IActionResult> AddShots(
        int id,
        AddPracticeSessionShotsRequest request,
        CancellationToken cancellationToken
    )
    {
        try
        {
            await _antiforgery.ValidateRequestAsync(HttpContext);
        }
        catch (AntiforgeryValidationException)
        {
            return BadRequest(new { message = "Invalid CSRF token." });
        }

        var user = await _userManager.GetUserAsync(User);

        if (user is null)
        {
            return Unauthorized();
        }

        await using var transaction = await _dbContext.Database
            .BeginTransactionAsync(IsolationLevel.ReadCommitted, cancellationToken);

        // Lock the owned session row so concurrent batches cannot allocate
        // overlapping shot numbers for the same practice session.
        await using var lockCommand = _dbContext.Database
            .GetDbConnection()
            .CreateCommand();
        lockCommand.Transaction = transaction.GetDbTransaction();
        lockCommand.CommandText =
            "SELECT `Id` FROM `PracticeSessions` WHERE `Id` = @sessionId AND `UserId` = @userId FOR UPDATE";

        var sessionIdParameter = lockCommand.CreateParameter();
        sessionIdParameter.ParameterName = "@sessionId";
        sessionIdParameter.Value = id;
        lockCommand.Parameters.Add(sessionIdParameter);

        var userIdParameter = lockCommand.CreateParameter();
        userIdParameter.ParameterName = "@userId";
        userIdParameter.Value = user.Id;
        lockCommand.Parameters.Add(userIdParameter);

        var lockedSessionId = await lockCommand.ExecuteScalarAsync(cancellationToken);

        if (lockedSessionId is null || lockedSessionId == DBNull.Value)
        {
            return NotFound(new { message = "Practice session not found." });
        }

        var session = await _dbContext.PracticeSessions
            .SingleAsync(
                session => session.Id == id && session.UserId == user.Id,
                cancellationToken
            );

        var maxShotNumber = await _dbContext.Shots
            .Where(shot => shot.PracticeSessionId == id)
            .Select(shot => (int?)shot.ShotNumber)
            .MaxAsync(cancellationToken) ?? 0;

        if (request.Shots!.Count > int.MaxValue - maxShotNumber)
        {
            return BadRequest(new { message = "No more shot numbers are available." });
        }

        var newShots = request.Shots.Select((shotRequest, index) => new Shot
        {
            PracticeSessionId = session.Id,
            ShotNumber = maxShotNumber + index + 1,
            Club = shotRequest.Club!.Trim(),
            Carry = shotRequest.Carry!.Value,
            CarrySide = shotRequest.CarrySide!.Value,
            BallSpeed = shotRequest.BallSpeed,
            LaunchAngle = shotRequest.LaunchAngle,
            PeakHeight = shotRequest.PeakHeight,
            TotalDistance = shotRequest.TotalDistance
        }).ToList();

        _dbContext.Shots.AddRange(newShots);
        await _dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return CreatedAtAction(
            nameof(GetById),
            new { id },
            newShots.Select(shot => new
            {
                shot.Id,
                shot.ShotNumber,
                shot.ShotAt,
                shot.Club,
                shot.Carry,
                shot.CarrySide,
                shot.BallSpeed,
                shot.LaunchAngle,
                shot.PeakHeight,
                shot.TotalDistance
            })
        );
    }

    [HttpPost("import/preview")]
    [RequestSizeLimit(2 * 1024 * 1024)]
    public async Task<IActionResult> PreviewImport([FromForm] IFormFile file)
    {
        // Validate the token sent with the uploaded file.
        try
        {
            await _antiforgery.ValidateRequestAsync(HttpContext);
        }
        catch (AntiforgeryValidationException)
        {
            return BadRequest(new { message = "Invalid CSRF token." });
        }

        var user = await _userManager.GetUserAsync(User);

        if (user is null)
        {
            return Unauthorized();
        }

        if (file.Length == 0)
        {
            return BadRequest(new { message = "The uploaded file is empty." });
        }

        // The extension is a usability check; the reader validates the content.
        if (!string.Equals(
                Path.GetExtension(file.FileName),
                ".csv",
                StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "Please select a CSV file." });
        }

        try
        {
            using var stream = file.OpenReadStream();

            var shots = await _csvReader.ReadAsync(stream);

            // Return selected fields instead of complete EF Core entities.
            // This preview does not add anything to the database.
            return Ok(new
            {
                shotCount = shots.Count,
                clubs = shots.Select(shot => shot.Club).Distinct().ToList(),
                shots = shots.Select(shot => new
                {
                    shot.ShotNumber,
                    shot.ShotAt,
                    shot.Club,
                    shot.Carry,
                    shot.CarrySide,
                    shot.BallSpeed,
                    shot.LaunchAngle,
                    shot.PeakHeight,
                    shot.TotalDistance
                }).ToList()
            });
        }
        catch (FormatException exception)
        {
            // The reader provides controlled messages with row and column details.
            return BadRequest(new { message = exception.Message });
        }
    }
    [HttpPost("import")]
    [RequestSizeLimit(2 * 1024 * 1024)]
    public async Task<IActionResult> Import(
        [FromForm] ImportPracticeSessionRequest request
    )
    {
        try
        {
            await _antiforgery.ValidateRequestAsync(HttpContext);
        }
        catch (AntiforgeryValidationException)
        {
            return BadRequest(new { message = "Invalid CSRF token." });
        }

        // Resolve the owner from the authenticated identity.
        var user = await _userManager.GetUserAsync(User);

        if (user is null)
        {
            return Unauthorized();
        }

        // [ApiController] validates the DTO before this method is executed.
        var file = request.File!;

        if (file.Length == 0)
        {
            return BadRequest(new { message = "The uploaded file is empty." });
        }

        if (!string.Equals(
                Path.GetExtension(file.FileName),
                ".csv",
                StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "Please select a CSV file." });
        }

        List<Shot> shots;

        try
        {
            using var stream = file.OpenReadStream();

            // Read and validate the complete file before tracking any new records.
            shots = await _csvReader.ReadAsync(stream);
        }
        catch (FormatException exception)
        {
            return BadRequest(new { message = exception.Message });
        }

        var session = new PracticeSession
        {
            UserId = user.Id,
            Name = request.Name!.Trim(),
            PracticeDate = request.PracticeDate!.Value,
            Shots = shots
        };

        // EF Core links the imported shots to this new session.
        _dbContext.PracticeSessions.Add(session);

        // Save the entire session in one operation.
        // The database transaction prevents a partial import if saving fails.
        await _dbContext.SaveChangesAsync();

        return StatusCode(StatusCodes.Status201Created, new
        {
            session.Id,
            session.Name,
            session.PracticeDate,
            ShotCount = session.Shots.Count
        });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(
    int id,
    UpdatePracticeSessionRequest request,
    CancellationToken cancellationToken
)
    {
        try
        {
            await _antiforgery.ValidateRequestAsync(HttpContext);
        }
        catch (AntiforgeryValidationException)
        {
            return BadRequest(new { message = "Invalid CSRF token." });
        }

        var user = await _userManager.GetUserAsync(User);

        if (user is null)
        {
            return Unauthorized();
        }

        // Load only a session owned by the authenticated user.
        var session = await _dbContext.PracticeSessions
            .SingleOrDefaultAsync(
                session => session.Id == id && session.UserId == user.Id,
                cancellationToken
            );

        if (session is null)
        {
            return NotFound(new { message = "Practice session not found." });
        }

        // Update only the editable practice details.
        // The owner and related shots remain unchanged.
        session.Name = request.Name!.Trim();
        session.PracticeDate = request.PracticeDate!.Value;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(
    int id,
    CancellationToken cancellationToken
)
    {
        try
        {
            await _antiforgery.ValidateRequestAsync(HttpContext);
        }
        catch (AntiforgeryValidationException)
        {
            return BadRequest(new { message = "Invalid CSRF token." });
        }

        var user = await _userManager.GetUserAsync(User);

        if (user is null)
        {
            return Unauthorized();
        }

        // Only load a session owned by the authenticated user.
        var session = await _dbContext.PracticeSessions
            .SingleOrDefaultAsync(
                session => session.Id == id && session.UserId == user.Id,
                cancellationToken
            );

        if (session is null)
        {
            return NotFound(new { message = "Practice session not found." });
        }

        // The database cascade rule deletes the related shots.
        // The shots do not need to be loaded into memory.
        _dbContext.PracticeSessions.Remove(session);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    [HttpPut("{id:int}/shots/{shotId:int}")]
    public async Task<IActionResult> UpdateShot(
    int id,
    int shotId,
    CreateShotRequest request,
    CancellationToken cancellationToken
)
    {
        try
        {
            await _antiforgery.ValidateRequestAsync(HttpContext);
        }
        catch (AntiforgeryValidationException)
        {
            return BadRequest(new { message = "Invalid CSRF token." });
        }

        var user = await _userManager.GetUserAsync(User);

        if (user is null)
        {
            return Unauthorized();
        }

        // Match the shot, its session and the session owner in the same query.
        var shot = await _dbContext.Shots
            .SingleOrDefaultAsync(
                shot => shot.Id == shotId
                    && shot.PracticeSessionId == id
                    && shot.PracticeSession.UserId == user.Id,
                cancellationToken
            );

        if (shot is null)
        {
            return NotFound(new { message = "Shot not found." });
        }

        // Reuse the same input validation as manual shot creation.
        shot.Club = request.Club!.Trim();
        shot.Carry = request.Carry!.Value;
        shot.CarrySide = request.CarrySide!.Value;
        shot.BallSpeed = request.BallSpeed;
        shot.LaunchAngle = request.LaunchAngle;
        shot.PeakHeight = request.PeakHeight;
        shot.TotalDistance = request.TotalDistance;

        // Keep the shot ID, session, sequence number and timestamp unchanged.
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new
        {
            shot.Id,
            shot.ShotNumber,
            shot.ShotAt,
            shot.Club,
            shot.Carry,
            shot.CarrySide,
            shot.BallSpeed,
            shot.LaunchAngle,
            shot.PeakHeight,
            shot.TotalDistance
        });
    }

    [HttpDelete("{id:int}/shots/{shotId:int}")]
    public async Task<IActionResult> DeleteShot(
    int id,
    int shotId,
    CancellationToken cancellationToken
)
    {
        try
        {
            await _antiforgery.ValidateRequestAsync(HttpContext);
        }
        catch (AntiforgeryValidationException)
        {
            return BadRequest(new { message = "Invalid CSRF token." });
        }

        var user = await _userManager.GetUserAsync(User);

        if (user is null)
        {
            return Unauthorized();
        }

        // Check the shot, its session and ownership in the same query.
        var shot = await _dbContext.Shots
            .SingleOrDefaultAsync(
                shot => shot.Id == shotId
                    && shot.PracticeSessionId == id
                    && shot.PracticeSession.UserId == user.Id,
                cancellationToken
            );

        if (shot is null)
        {
            return NotFound(new { message = "Shot not found." });
        }

        // Delete only this shot. Keep the session and other shot numbers.
        _dbContext.Shots.Remove(shot);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }
}
