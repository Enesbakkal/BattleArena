using BattleArena.Domain.Characters;
using Microsoft.EntityFrameworkCore;

namespace BattleArena.Application.Abstractions;

// Persistence details live in Infrastructure; Application reads/writes only through this contract (implemented by DbContext there).
public interface IApplicationDbContext
{
    DbSet<Character> Characters { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
