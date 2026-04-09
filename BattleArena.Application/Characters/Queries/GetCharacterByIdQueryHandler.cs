using BattleArena.Application.Abstractions;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BattleArena.Application.Characters.Queries;

public sealed class GetCharacterByIdQueryHandler : IRequestHandler<GetCharacterByIdQuery, CharacterDetailDto?>
{
    private readonly IApplicationDbContext _db;

    public GetCharacterByIdQueryHandler(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<CharacterDetailDto?> Handle(GetCharacterByIdQuery request, CancellationToken cancellationToken)
    {
        return await _db.Characters
            .AsNoTracking()
            .Where(c => c.Id == request.Id)
            .Select(c => new CharacterDetailDto(
                c.Id,
                c.Name,
                c.Universe,
                c.Biography,
                c.Rarity,
                c.BaseAttack,
                c.BaseDefense,
                c.BaseSpeed,
                c.ImageUrl,
                c.CreatedAtUtc))
            .FirstOrDefaultAsync(cancellationToken);
    }
}
