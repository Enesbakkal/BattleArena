using MediatR;

namespace BattleArena.Application.Characters.Commands;

// CQRS command: create a catalog character; MediatR handler persists it and returns the new Id.
public sealed record CreateCharacterCommand(
    string Name,
    string Universe,
    string? Biography,
    int Rarity,
    int BaseAttack,
    int BaseDefense,
    int BaseSpeed,
    string? ImageUrl) : IRequest<Guid>;
