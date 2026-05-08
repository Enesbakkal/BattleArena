namespace BattleArena.Application.Abstractions;

public interface ICharacterSearchReadModel
{
    Task<IReadOnlyList<CharacterSearchHit>> SearchAsync(
        string term,
        int size = 20,
        CancellationToken cancellationToken = default);
}

public sealed record CharacterSearchHit(
    Guid Id,
    string Name,
    string Universe,
    string? Biography,
    int Rarity,
    int BaseAttack,
    int BaseDefense,
    int BaseSpeed,
    DateTime CreatedAtUtc);