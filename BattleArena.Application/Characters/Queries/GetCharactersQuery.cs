using MediatR;

namespace BattleArena.Application.Characters.Queries;

// CQRS query: paged list for grids; read-only, no writes.
public sealed record GetCharactersQuery(int Page, int PageSize) : IRequest<PagedCharacterRowsResult>;

// Flat row for API/React; avoids exposing the domain entity shape directly.
public sealed record CharacterRowDto(
    Guid Id,
    string Name,
    string Universe,
    int Rarity,
    int BaseAttack,
    int BaseDefense,
    int BaseSpeed,
    string? ImageUrl,
    DateTime CreatedAtUtc);

// Pagination envelope: total count + current page items.
public sealed record PagedCharacterRowsResult(IReadOnlyList<CharacterRowDto> Items, int TotalCount);
