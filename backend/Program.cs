// Import database context and Entity Framework Core
using GolfPracticeAnalyzer.Api.Data;
using Microsoft.EntityFrameworkCore;

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
app.UseAuthorization();

app.MapControllers();

app.Run();
