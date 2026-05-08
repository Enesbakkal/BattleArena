using BattleArena.Application.Abstractions;
using Elastic.Clients.Elasticsearch;
using Microsoft.Extensions.Options;

namespace BattleArena.Infrastructure.Search;

public sealed class ElasticsearchCharacterSearchReadModel : ICharacterSearchReadModel
{
    private readonly ElasticsearchClient? _client;
    private readonly ElasticsearchOptions _options;

    public ElasticsearchCharacterSearchReadModel(
        ElasticsearchClient? client,
        IOptions<ElasticsearchOptions> options)
    {
        _client = client;
        _options = options.Value;
    }

    public async Task<IReadOnlyList<CharacterSearchHit>> SearchAsync(
        string term,
        int size = 20,
        CancellationToken cancellationToken = default)
    {
        if (_client is null || !_options.Enabled || string.IsNullOrWhiteSpace(term))
            return Array.Empty<CharacterSearchHit>();

        var response = await _client.SearchAsync<CharacterSearchDocument>(s => s
            .Index(_options.CharactersIndex)
            .Size(size)
            .Query(q => q
                .MultiMatch(mm => mm
                    .Query(term)
                    .Fields(new[] { "name", "universe", "biography" }))),
            cancellationToken);

        if (!response.IsValidResponse || response.Documents is null)
            return Array.Empty<CharacterSearchHit>();

        return response.Documents
            .Select(d => new CharacterSearchHit(
                d.Id,
                d.Name,
                d.Universe,
                d.Biography,
                d.Rarity,
                d.BaseAttack,
                d.BaseDefense,
                d.BaseSpeed,
                d.CreatedAtUtc))
            .ToList();
    }
}