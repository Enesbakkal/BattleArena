namespace BattleArena.Infrastructure.Search;

public sealed class ElasticsearchOptions
{
    public const string SectionName = "Elasticsearch";

    public bool Enabled { get; set; }

    public string Url { get; set; } = "http://localhost:9200";

    public string CharactersIndex { get; set; } = "characters";
}