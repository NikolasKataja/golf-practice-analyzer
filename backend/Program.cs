// Import database context and Entity Framework Core
using GolfPracticeAnalyzer.Api.Data;
using Microsoft.EntityFrameworkCore;
using GolfPracticeAnalyzer.Api.Models;
using Microsoft.AspNetCore.Identity;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();


// Read ConnectionStrings:DefaultConnection from configuration.
// In development, this also includes values stored in User Secrets.
// The ?? operator throws an exception if the value is null.
var connectionString =
    builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Database connection settings are missing");

// Register AppDbContext in the dependency injection container.
// By default, each HTTP request gets its own scoped context instance.
// The lambda expression (options => ...) configures the context.
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(
        connectionString,
        // Connect to the database to detect its server version
        // when these context options are initialized.
        ServerVersion.AutoDetect(connectionString)
    ));

builder.Services
    .AddIdentityCore<ApplicationUser>(options =>
    {
        // Require a unique email address for each account.
        options.User.RequireUniqueEmail = true;

         // Configure password requirements.
        options.Password.RequiredLength = 12;
        options.Password.RequireDigit = false;
        options.Password.RequireLowercase = false;
        options.Password.RequireUppercase = false;
        options.Password.RequireNonAlphanumeric = false;

        // Email confirmation is outside this project's scope.
        options.SignIn.RequireConfirmedEmail = false;
        options.SignIn.RequireConfirmedAccount = false;

        // Temporarily block login after repeated failed attempts.
        options.Lockout.MaxFailedAccessAttempts = 5;
        options.Lockout.DefaultLockoutTimeSpan =
            TimeSpan.FromMinutes(5);
        options.Lockout.AllowedForNewUsers = true;
    })
    // Store Identity's user data through our existing database context.
    .AddEntityFrameworkStores<AppDbContext>()
    // Provide services for signing users in and out.
    .AddSignInManager();

// Use Identity's application cookie to identify signed-in users.
builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme =
            IdentityConstants.ApplicationScheme;
        options.DefaultChallengeScheme =
            IdentityConstants.ApplicationScheme;
        options.DefaultSignInScheme =
            IdentityConstants.ApplicationScheme;
    })
    .AddIdentityCookies();

builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.Name = "GolfPracticeAnalyzer.Auth";

    // Prevent JavaScript from reading the authentication cookie.
    options.Cookie.HttpOnly = true;

    options.Cookie.SameSite = SameSiteMode.Lax;

    // Allow our local HTTP setup, but require HTTPS outside development.
    options.Cookie.SecurePolicy = builder.Environment.IsDevelopment()
        ? CookieSecurePolicy.SameAsRequest
        : CookieSecurePolicy.Always;

    // Renew the ticket when an active session passes its renewal threshold.
    options.ExpireTimeSpan = TimeSpan.FromHours(2);
    options.SlidingExpiration = true;

    // Return HTTP status codes instead of redirecting to HTML login pages.
    options.Events.OnRedirectToLogin = context =>
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return Task.CompletedTask;
    };

    options.Events.OnRedirectToAccessDenied = context =>
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        return Task.CompletedTask;
    };
});

// Register support for checking access to protected endpoints.
builder.Services.AddAuthorization();

// Configure CSRF tokens for requests that change data.
// React will send the request token in this header.
// Token generation and validation will be implemented in the controller.
builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-CSRF-TOKEN";
    options.Cookie.Name = "GolfPracticeAnalyzer.Csrf";
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Lax;

    options.Cookie.SecurePolicy = builder.Environment.IsDevelopment()
        ? CookieSecurePolicy.SameAsRequest
        : CookieSecurePolicy.Always;
});

var app = builder.Build();


if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    var connected = await db.Database.CanConnectAsync();

    app.Logger.LogInformation(
        "Database connection: {Status}",
        connected ? "OK" : "Failed"
    );
    if (!connected)
    {
        throw new InvalidOperationException("MariaDB connection failed");
    }
}
// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();
