# Elasticsearch Notes (Tur 10-11)

## What is wired
- Infrastructure has `Elastic.Clients.Elasticsearch` package.
- `ElasticsearchOptions` is bound from configuration (`Elasticsearch` section).
- Real `ElasticsearchClient` is registered only when `Elasticsearch:Enabled = true`; otherwise a null-safe registration keeps startup stable.

## Why this shape
- The app can start even when Elasticsearch is not running.
- Search features can depend on a single DI registration point.
- Index document model (`CharacterSearchDocument`) is kept separate from domain entities.

## Next step
- Add an Application search port (for example `ICharacterSearchReadModel`).
- Implement an Infrastructure adapter that queries Elasticsearch.
- Optionally add index write/update/delete flow tied to create/update/delete handlers.
