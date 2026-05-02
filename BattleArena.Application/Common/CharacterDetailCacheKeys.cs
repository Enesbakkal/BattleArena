namespace BattleArena.Application.Common;

public static class CharacterDetailCacheKeys
{
    public static string Detail(Guid id) => $"character:detail:{id:D}";
}