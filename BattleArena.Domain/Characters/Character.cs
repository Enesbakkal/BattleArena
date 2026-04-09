namespace BattleArena.Domain.Characters;

// Catalog character: arena buffs and in-battle transient state do not live here—only identity + catalog stats.
public sealed class Character
{
    // Parameterless ctor for EF Core; kept private so callers cannot construct with `new Character()` from outside.
    private Character()
    {
    }

    public Guid Id { get; private set; }

    public string Name { get; private set; } = null!;

    // Universe / franchise label (e.g. One Piece); other IPs can use the same column later.
    public string Universe { get; private set; } = null!;

    public string? Biography { get; private set; }

    // Simple rarity scale (1–5); business rules can be tightened later.
    public int Rarity { get; private set; }

    public int BaseAttack { get; private set; }

    public int BaseDefense { get; private set; }

    public int BaseSpeed { get; private set; }

    public string? ImageUrl { get; private set; }

    public DateTime CreatedAtUtc { get; private set; }

    // Factory: valid Character instances should be created through this method (common DDD style).
    public static Character Create(
        string name,
        string universe,
        string? biography,
        int rarity,
        int baseAttack,
        int baseDefense,
        int baseSpeed,
        string? imageUrl,
        DateTime utcNow)
    {
        return new Character
        {
            Id = Guid.NewGuid(),
            Name = name,
            Universe = universe,
            Biography = biography,
            Rarity = rarity,
            BaseAttack = baseAttack,
            BaseDefense = baseDefense,
            BaseSpeed = baseSpeed,
            ImageUrl = imageUrl,
            CreatedAtUtc = utcNow
        };
    }

    public void Update(
        string name,
        string universe,
        string? biography,
        int rarity,
        int baseAttack,
        int baseDefense,
        int baseSpeed,
        string? imageUrl)
    {
        Name = name;
        Universe = universe;
        Biography = biography;
        Rarity = rarity;
        BaseAttack = baseAttack;
        BaseDefense = baseDefense;
        BaseSpeed = baseSpeed;
        ImageUrl = imageUrl;
    }
}