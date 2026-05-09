namespace BattleArena.Application.Abstractions;

public interface ICharacterSearchIndexer
{
    Task UpsertAsync(CharacterSearchIndexPayload payload, CancellationToken cancellationToken = default);

    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}

public sealed record CharacterSearchIndexPayload(
    Guid Id,
    string Name,
    string Universe,
    string? Biography,
    int Rarity,
    int BaseAttack,
    int BaseDefense,
    int BaseSpeed,
    DateTime CreatedAtUtc);