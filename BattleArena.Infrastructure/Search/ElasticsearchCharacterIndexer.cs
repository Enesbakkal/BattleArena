using BattleArena.Application.Abstractions;
using Elastic.Clients.Elasticsearch;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace BattleArena.Infrastructure.Search;

public sealed class ElasticsearchCharacterIndexer : ICharacterSearchIndexer
{
    private readonly ElasticsearchClient? _client;
    private readonly ElasticsearchOptions _options;
    private readonly ILogger<ElasticsearchCharacterIndexer> _logger;

    public ElasticsearchCharacterIndexer(
        ElasticsearchClient? client,
        IOptions<ElasticsearchOptions> options,
        ILogger<ElasticsearchCharacterIndexer> logger)
    {
        _client = client;
        _options = options.Value;
        _logger = logger;
    }

    public async Task UpsertAsync(CharacterSearchIndexPayload payload, CancellationToken cancellationToken = default)
    {
        if (_client is null || !_options.Enabled)
            return;

        try
        {
            var doc = new CharacterSearchDocument
            {
                Id = payload.Id,
                Name = payload.Name,
                Universe = payload.Universe,
                Biography = payload.Biography,
                Rarity = payload.Rarity,
                BaseAttack = payload.BaseAttack,
                BaseDefense = payload.BaseDefense,
                BaseSpeed = payload.BaseSpeed,
                CreatedAtUtc = payload.CreatedAtUtc,
            };

            IndexName index = _options.CharactersIndex;
            await _client.IndexAsync(doc, index, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Elasticsearch upsert failed for character {CharacterId}", payload.Id);
        }
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        if (_client is null || !_options.Enabled)
            return;

        try
        {
            IndexName index = _options.CharactersIndex;
            Id documentId = id.ToString();
            await _client.DeleteAsync(index, documentId, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Elasticsearch delete failed for character {CharacterId}", id);
        }
    }
}
