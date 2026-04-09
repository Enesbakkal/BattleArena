using MediatR;

namespace BattleArena.Application.Characters.Queries;

public sealed record GetCharacterByIdQuery(Guid Id) : IRequest<CharacterDetailDto?>;

// Full catalog row for detail/edit screens (includes biography).
public sealed record CharacterDetailDto(
    Guid Id,
    string Name,
    string Universe,
    string? Biography,
    int Rarity,
    int BaseAttack,
    int BaseDefense,
    int BaseSpeed,
    string? ImageUrl,
    DateTime CreatedAtUtc);
