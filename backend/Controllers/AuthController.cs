using GolfPracticeAnalyzer.Api.DTOs.Auth;
using GolfPracticeAnalyzer.Api.Models;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace GolfPracticeAnalyzer.Api.Controllers;

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IAntiforgery _antiforgery;

    // Dependency injection supplies the services registered in Program.cs
    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IAntiforgery antiforgery
    )
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _antiforgery = antiforgery;
    }

    [AllowAnonymous]
    [HttpGet("csrf")]
    public IActionResult GetCsrfToken()
    {   
        // Set the CSRF cookie and return its matching request token.
        // React will send the request token in the X-CSRF-TOKEN header.
        var tokens = _antiforgery.GetAndStoreTokens(HttpContext);

        // Tokens must not be stored in browser or proxy caches
        Response.Headers.CacheControl = "no-store";

        return Ok(new { token = tokens.RequestToken });
    }


    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        if (!await HasValidCsrfTokenAsync())
        {
            return BadRequest(new { message = "Invalid CSRF token" });
        }

        // Keep account creation seperate from an existing signed-in session
        if (User.Identity?.IsAuthenticated == true)
        {
            return BadRequest(new { message = "Cannot create a new account while signed in" });   
        }

        var email = request.Email.Trim();

        var user = new ApplicationUser
        {
            // Identity requires a username, so we use the email as the username
            UserName = email,
            Email = email
        };

        // Identity validates the password, hashes it and saves the user.
        // Never assign or calculate PasswordHash manually.
        var result = await _userManager.CreateAsync(user, request.Password);

        if (!result.Succeeded)
        {
            return BadRequest(new
            {
                message = "Account creation failed",
                errors = result.Errors.Select(error => error.Description)
            });
        }

        // Registration does not automatically sign in the user
        return Ok(new { message = "Account created successfully! You can now sign in."});
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        if (!await HasValidCsrfTokenAsync())
        {
            return BadRequest(new { message = "Invalid CSRF token"});
        }

        if (User.Identity?.IsAuthenticated == true)
        {
            return BadRequest(new { message = "You are already signed in" });
        }

        var user = await _userManager.FindByEmailAsync(request.Email.Trim());

        // Use the same response for inknown emails and incorrect passwords
        if (user is null)
        {
            return Unauthorized(new { message = "Sign-in failed"});
        }

        // Verify the password and issue the authentication cookie on success.
        // Failed attempts count towards the configured account lockout.
        var result = await _signInManager.PasswordSignInAsync(
            user,
            request.Password,
            isPersistent: false,
            lockoutOnFailure: true);

        if (!result.Succeeded)
        {
            return Unauthorized(new { message = "Sign-in Failed"});
        }

        return Ok(new { user.Id, user.Email });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        // Resolve the user from the authenticated identity
        var user = await _userManager.GetUserAsync(User);

        if (user is null)
        {
            return Unauthorized();
        }

        // Return only the information needed by the frontend
        // Do not return the complete Identity user object
        return Ok(new { user.Id, user.Email });
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        if (!await HasValidCsrfTokenAsync())
        {
            return BadRequest(new { message = "Invalid CSRF token." });
        }

        // Instruct the browser to remove the authentication cookie
        await _signInManager.SignOutAsync();

        return NoContent();
    }

    [Authorize]
    [HttpPost("delete-account")]
    public async Task<IActionResult> DeleteAccount(
        DeleteAccountRequest request)
    {
        if (!await HasValidCsrfTokenAsync())
        {
            return BadRequest(new { message = "Invalid CSRF token." });
        }

        // Select the account from the signed-in identity, not a client-sent ID
        var user = await _userManager.GetUserAsync(User);

        if (user is null)
        {
            return Unauthorized();
        }

        // Verify the current password and apply account lockout rules
        // This checks the password without creating another login session
        var passwordResult = await _signInManager.CheckPasswordSignInAsync(
            user,
            request.Password,
            lockoutOnFailure: true);

        if (!passwordResult.Succeeded)
        {
            return BadRequest(new { message = "Account deletion failed: incorrect password" }); 
        }

        // Database cascade rules also delete this user's sessions and shots
        var result = await _userManager.DeleteAsync(user);

        if (!result.Succeeded)
        {
            return BadRequest(new { message = "Account deletion failed" });
        }

        // Remove the current browser's authentication cookie after deletion
        await _signInManager.SignOutAsync();

        return NoContent();
    }

    private async Task<bool> HasValidCsrfTokenAsync()
    {
        try
        {
            // Validate the request header against the CSRF cookie
            // and the current user's identity
            await _antiforgery.ValidateRequestAsync(HttpContext);
            return true;
        }
        catch (AntiforgeryValidationException)
        {
            // Convert an invalid or missing token into a controlled response
            return false;
        }
    }

}