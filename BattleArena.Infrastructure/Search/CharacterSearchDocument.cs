namespace BattleArena.Infrastructure.Search;

public sealed class CharacterSearchDocument
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Universe { get; init; } = string.Empty;
    public string? Biography { get; init; }
    public int Rarity { get; init; }
    public int BaseAttack { get; init; }
    public int BaseDefense { get; init; }
    public int BaseSpeed { get; init; }
    public DateTime CreatedAtUtc { get; init; }
}