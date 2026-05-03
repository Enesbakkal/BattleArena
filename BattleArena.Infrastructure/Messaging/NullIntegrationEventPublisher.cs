using BattleArena.Application.Abstractions;

namespace BattleArena.Infrastructure.Messaging;

public sealed class NullIntegrationEventPublisher : IIntegrationEventPublisher
{
    public Task PublishAsync<TEvent>(TEvent integrationEvent, CancellationToken cancellationToken = default)
        where TEvent : class
        => Task.CompletedTask;
}