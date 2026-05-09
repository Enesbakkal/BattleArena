using BattleArena.Application.Abstractions;
using MediatR;

namespace BattleArena.Application.Characters.Queries;

public sealed record SearchCharactersQuery(string Term, int Size = 20)
    : IRequest<IReadOnlyList<CharacterSearchHit>>;