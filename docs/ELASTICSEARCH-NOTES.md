# Elasticsearch Notes (Tur 10-11)

## What is wired
- Infrastructure has `Elastic.Clients.Elasticsearch` package.
- `ElasticsearchOptions` is bound from configuration (`Elasticsearch` section).
- Real `ElasticsearchClient` is registered only when `Elasticsearch:Enabled = true`; otherwise a null-safe registration keeps startup stable.

### Base appsettings (Tur 12)
- `BattleArena.Api/appsettings.json` includes an `Elasticsearch` section with `Enabled: false` by default (`Url`, `CharactersIndex`), so configuration binds for non-Development profiles too.

### Compose (Tur 13)
- `docker-compose.yml` defines an `elasticsearch` service (single-node, security off for dev).
- Both `battlearena.api` and `battlearena.api-2` set `Elasticsearch__Enabled`, `Elasticsearch__Url` (`http://elasticsearch:9200`), and `Elasticsearch__CharactersIndex`, and `depends_on` includes `elasticsearch`.

### Development appsettings (Tur 14)
- `BattleArena.Api/appsettings.Development.json` includes an `Elasticsearch` section (`Enabled`, `Url`, `CharactersIndex`).
- API’yi **makinede** çalıştırıp ES’yi yalnızca Docker’da açıyorsan `Url` genelde `http://localhost:9200`; tamamen compose içinde çalışırken ortam değişkenleri compose’daki değerleri ezer.

## Why this shape
- The app can start even when Elasticsearch is not running.
- Search features can depend on a single DI registration point.
- Index document model (`CharacterSearchDocument`) is kept separate from domain entities.

## Next step (kalan iyileştirmeler)
- Prod için güvenlik (TLS, kimlik), indeks şablonları/mapping, gerekiyorsa gerçek event-driven indeksleme.
