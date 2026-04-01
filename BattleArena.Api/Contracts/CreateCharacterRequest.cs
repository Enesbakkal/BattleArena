namespace BattleArena.Api.Contracts;

// HTTP body for POST /api/characters; maps to CreateCharacterCommand in the controller.
public sealed class CreateCharacterRequest
{
    public string Name { get; set; } = string.Empty;

    public string Universe { get; set; } = string.Empty;

    public string? Biography { get; set; }

    public int Rarity { get; set; }

    public int BaseAttack { get; set; }

    public int BaseDefense { get; set; }

    public int BaseSpeed { get; set; }

    public string? ImageUrl { get; set; }
}
