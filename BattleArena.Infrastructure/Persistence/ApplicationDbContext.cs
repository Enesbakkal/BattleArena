using BattleArena.Application.Abstractions;
using BattleArena.Domain.Characters;
using Microsoft.EntityFrameworkCore;

namespace BattleArena.Infrastructure.Persistence;

// EF Core DbContext; implements IApplicationDbContext so Application handlers stay persistence-agnostic.
public sealed class ApplicationDbContext : DbContext, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Character> Characters => Set<Character>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
