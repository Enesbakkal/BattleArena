# Günlük not — 2026-04-22 (Integration stack çalışması)

Bu dosya, **aynı gün yapılan kod değişikliklerinin özeti**dir; kod daha sonra tekrar uygulanmak üzere burada toplanır. Orijinal tasarım: tek yerden DI kaydı, Application’da port/yüzey, Infrastructure’da RabbitMQ ve Redis implementasyonları.

---

## 1. NuGet / paketler

**BattleArena.Application**

- `Microsoft.Extensions.Caching.Abstractions` 10.0.5  
- `Microsoft.Extensions.Caching.Memory` 10.0.5  

**BattleArena.Infrastructure**

- `RabbitMQ.Client` **6.8.1** (7.x ile API uyumsuzdu; publish için `CreateModel()` kullanıldı)  
- `Microsoft.Extensions.Caching.StackExchangeRedis` 10.0.5  
- `Microsoft.Extensions.Options.ConfigurationExtensions` 10.0.5  
- `Microsoft.Extensions.Caching.Memory` 10.0.5  

**BattleArena.Api**

- `Serilog.AspNetCore` 9.0.0  

---

## 2. Application katmanı — yeni / değişen dosyalar

**Yeni**

- `Abstractions/IIntegrationEventPublisher.cs` — `PublishAsync<TEvent>(TEvent, CancellationToken)`  
- `IntegrationEvents/CharacterCreatedIntegrationEvent.cs` — `Id`, `Name`, `OccurredAtUtc`  
- `Common/CharacterDetailCacheKeys.cs` — `Detail(Guid)` → `character:detail:{guid:D}`  

**Değişen**

- `Characters/Commands/CreateCharacterCommandHandler.cs` — `IIntegrationEventPublisher` dependency; kayıt sonrası `CharacterCreatedIntegrationEvent` yayını  
- `Characters/Commands/UpdateCharacterCommandHandler.cs` — `IMemoryCache` + `IDistributedCache`; kayıttan sonra detay önbelleğini invalidate  
- `Characters/Commands/DeleteCharacterCommandHandler.cs` — aynı invalidate  
- `Characters/Queries/GetCharacterByIdQueryHandler.cs` — iki katman: önce `IMemoryCache` (~30 sn), sonra `IDistributedCache` (UTF-8 JSON, ~5 dk), sonra DB; bulunca iki katmana da yazar  

---

## 3. Infrastructure katmanı — yeni / değişen dosyalar

**Yeni (`Messaging/`)**

- `RabbitMqOptions.cs` — `SectionName = "RabbitMq"`, `Enabled`, `HostName`, kimlik bilgileri, `ExchangeName` (varsayılan `battlearena.events`)  
- `RabbitMqConnectionHolder.cs` — `Lazy<IConnection>`, `CreateConnection()`  
- `RabbitMqIntegrationEventPublisher.cs` — `CreateModel()`, exchange declare topic durable, `CharacterCreatedIntegrationEvent` → routing key `character.created`, JSON camelCase, `Persistent = true`  
- `NullIntegrationEventPublisher.cs` — `Enabled: false` iken no-op  

**Değişen**

- `DependencyInjection.cs`  
  - `AddMemoryCache()`  
  - `ConnectionStrings:Redis` doluysa `AddStackExchangeRedisCache`, değilse `AddDistributedMemoryCache()`  
  - `Configure<RabbitMqOptions>(configuration.GetSection(RabbitMqOptions.SectionName))`  
  - `RabbitMq:Enabled` true ise `RabbitMqConnectionHolder` + `RabbitMqIntegrationEventPublisher`; değilse `NullIntegrationEventPublisher`  

---

## 4. API katmanı

**Değişen**

- `Program.cs` — `UseSerilog` (configuration + services), `UseSerilogRequestLogging()`, try/catch/finally `Log.CloseAndFlush()`  
- `appsettings.json` — `RabbitMq` bloğu (`Enabled: false` varsayılan), `Serilog` (Console sink, minimum levels)  
- `appsettings.Development.json` — `RabbitMq` host localhost; Redis satırı **bilerek boş bırakılmıştı** (Redis yokken bağlantı hatası riskine karşı); Redis kullanımında `ConnectionStrings:Redis` eklenir  

---

## 5. Repo kökü (`BattleArena/`)

**Yeni**

- `Dockerfile` — çok aşamalı build; context klasörü `BattleArena`; publish çıktısı `aspnet:10.0`; `ASPNETCORE_URLS=http://+:8080`, port 8080  
- `docker-compose.yml` — `rabbitmq:3-management-alpine` (5672, 15672), `redis:7-alpine` (6379)  
- `.dockerignore` — `bin/obj/.git/web/node_modules` vb.  

**Not:** Docker daemon kapalı ortamda `docker build` test edilemedi; image tag’leri `mcr.microsoft.com/dotnet/sdk:10.0` ve `aspnet:10.0` (makinede .NET 10 image’ları olmalı).

---

## 6. Web dokümantasyonu

- `web/ProjectQandA-UI.md` — dosya sonuna kısa not: Agent/backend sprint için kod örneklerinin **küçük paketler** (ör. ~3 class) halinde verilmesi tercihi; entegrasyon özeti için `docs/`  

(Aynı gün ayrıca silinen/geçici dokümanlar: bu günlük dosyasında birleştirilen `INTEGRATION-STACK.md` ve `WCF-and-integration.md` içerik özeti aşağıda.)

---

## 7. WCF / SOAP — mülakat notu (koddan bağımsız)

- **WCF:** Çoğu zaman **miras / kurumsal entegrasyon** (SOAP, WSDL). Yeşil alanda iç API için varsayılan genelde REST veya gRPC; SOAP gerekiyorsa **CoreWCF veya kenarda adapter** + içerde port (`ILegacyPartnerClient` benzeri).  
- **Yeşil alan:** “ASLA WCF” demek kabalık; doğru çerçeve **karşı tarafın sözleşmesi ve yaşam döngüsü**.  
- BattleArena demo mimarisi: **REST + integration events**; SOAP yüzeyi eklenirse yine **tek Infrastructure köprüsü**, domain/application’a sızmaz.

---

## 8. Yerel çalıştırma hatırlatması

```bash
cd BattleArena
docker compose up -d
```

Sonra (ör. user secrets veya Development ayarı):

- `ConnectionStrings:Redis` = `localhost:6379`  
- `RabbitMq:Enabled` = `true`, `RabbitMq:HostName` = `localhost`  

RabbitMQ yönetim UI: http://localhost:15672 (varsayılan guest/guest).

---

## 9. Bu günlükten sonra kod nasıl geri yüklenir?

1. Paketleri yukarıdaki listeye göre `dotnet add` ile ekle.  
2. Bu dokümanda §2–§5’te listelenen dosyaları ve içeriklerini yeniden oluştur (veya git geçmişinden cherry-pick / stash kullan).  
3. `docker-compose` ve `Dockerfile` ile yerel broker/cache ve opsiyonel API image.  

İstersen sonraki oturumda assistana **“Üçer üçer dosya ver”** dene — insan gözü için daha rahat takip.
