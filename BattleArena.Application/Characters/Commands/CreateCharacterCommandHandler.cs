using BattleArena.Application.Abstractions;
using BattleArena.Application.IntegrationEvents;
using BattleArena.Domain.Characters;
using MediatR;

namespace BattleArena.Application.Characters.Commands;

public sealed class CreateCharacterCommandHandler : IRequestHandler<CreateCharacterCommand, Guid>
{
    private readonly IApplicationDbContext _db;
    private readonly IIntegrationEventPublisher _integrationEvents;
    private readonly ICharacterSearchIndexer _searchIndexer;

    public CreateCharacterCommandHandler(
        IApplicationDbContext db,
        IIntegrationEventPublisher integrationEvents,
        ICharacterSearchIndexer searchIndexer)
    {
        _db = db;
        _integrationEvents = integrationEvents;
        _searchIndexer = searchIndexer;
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

        await _searchIndexer.UpsertAsync(
            new CharacterSearchIndexPayload(
                entity.Id,
                entity.Name,
                entity.Universe,
                entity.Biography,
                entity.Rarity,
                entity.BaseAttack,
                entity.BaseDefense,
                entity.BaseSpeed,
                entity.CreatedAtUtc),
            cancellationToken);

        return entity.Id;
    }
}