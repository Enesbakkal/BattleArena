using MediatR;

namespace BattleArena.Application.Characters.Commands;

public sealed record DeleteCharacterCommand(Guid Id) : IRequest<bool>;
