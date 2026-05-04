using BattleArena.Application.Abstractions;
using BattleArena.Application.IntegrationEvents;
using BattleArena.Domain.Characters;
using MediatR;

namespace BattleArena.Application.Characters.Commands;

public sealed class CreateCharacterCommandHandler : IRequestHandler<CreateCharacterCommand, Guid>
{
    private readonly IApplicationDbContext _db;
    private readonly IIntegrationEventPublisher _integrationEvents;

    public CreateCharacterCommandHandler(
        IApplicationDbContext db,
        IIntegrationEventPublisher integrationEvents)
    {
        _db = db;
        _integrationEvents = integrationEvents;
    }

    public async Task<Guid> Handle(CreateCharacterCommand request, CancellationToken cancellationToken)
    {
        var entity = Character.Create(
            request.Name,
            request.Universe,
            request.Biography,
            request.Rarity,
            request.BaseAttack,
            request.BaseDefense,
            request.BaseSpeed,
            request.ImageUrl,
            DateTime.UtcNow);

        _db.Characters.Add(entity);
        await _db.SaveChangesAsync(cancellationToken);

        await _integrationEvents.PublishAsync(
            new CharacterCreatedIntegrationEvent(entity.Id, entity.Name, DateTime.UtcNow),
            cancellationToken);

        return entity.Id;
    }
}