using GolfPracticeAnalyzer.Api.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace GolfPracticeAnalyzer.Api.Data;

public class AppDbContext : IdentityUserContext<ApplicationUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<PracticeSession> PracticeSessions { get; set; }
    public DbSet<Shot> Shots { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<PracticeSession>(entity =>
        {
            entity.Property(session => session.Name)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(session => session.PracticeDate)
                .HasColumnType("date");

            entity.HasOne(session => session.User)
                .WithMany(user => user.PracticeSessions)
                .HasForeignKey(session => session.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Shot>(entity =>
        {
            entity.Property(shot => shot.Club)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(shot => shot.Carry)
                .HasPrecision(10, 3);

            entity.Property(shot => shot.CarrySide)
                .HasPrecision(10, 3);

            entity.Property(shot => shot.BallSpeed)
                .HasPrecision(10, 3);

            entity.Property(shot => shot.LaunchAngle)
                .HasPrecision(10, 3);

            entity.Property(shot => shot.PeakHeight)
                .HasPrecision(10, 3);

            entity.Property(shot => shot.TotalDistance)
                .HasPrecision(10, 3);

            entity.HasOne(shot => shot.PracticeSession)
                .WithMany(session => session.Shots)
                .HasForeignKey(shot => shot.PracticeSessionId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasIndex(shot => new
                {
                    shot.PracticeSessionId,
                    shot.ShotNumber
                })
                .IsUnique();
        });
    }
}