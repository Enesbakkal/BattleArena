using BattleArena.Application.Abstractions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BattleArena.Application.Characters.Queries;

// Query handler: server-side paging (Skip/Take) so we do not load the whole table into memory.
public sealed class GetCharactersQueryHandler : IRequestHandler<GetCharactersQuery, PagedCharacterRowsResult>
{
    private readonly IApplicationDbContext _db;

    public GetCharactersQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<PagedCharacterRowsResult> Handle(GetCharactersQuery request, CancellationToken cancellationToken)
    {
        var page = Math.Max(1, request.Page);
        var pageSize = Math.Clamp(request.PageSize, 1, 200);

        var query = _db.Characters.AsNoTracking().OrderByDescending(c => c.CreatedAtUtc);

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new CharacterRowDto(
                c.Id,
                c.Name,
                c.Universe,
                c.Rarity,
                c.BaseAttack,
                c.BaseDefense,
                c.BaseSpeed,
                c.ImageUrl,
                c.CreatedAtUtc))
            .ToListAsync(cancellationToken);

        return new PagedCharacterRowsResult(items, total);
    }
}
