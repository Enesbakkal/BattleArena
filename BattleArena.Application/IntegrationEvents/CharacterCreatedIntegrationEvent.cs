namespace BattleArena.Application.IntegrationEvents;

public sealed record CharacterCreatedIntegrationEvent(
    Guid Id,
    string Name,
    DateTime OccurredAtUtc);