# Interview closing summary (BattleArena)

Tek kaynak: mülakatta anlatım, yarın yapılacak doğrulama ve yapılandırma özeti. Kod satırı detayı için ilgili sınıflara bak; isteğe bağlı ek ES notları `docs/ELASTICSEARCH-NOTES.md`.

---

## Mimari (tek paragraf)

**CQRS benzeri akış:** HTTP katmanı `IMediator.Send` ile komut/sorgu gönderir; iş kuralları **Application**’da handler’larda, kalıcılık ve dış sistemler **Infrastructure**’da. **Port–adapter:** `IIntegrationEventPublisher`, `IApplicationDbContext`, `ICharacterSearchReadModel`, `ICharacterSearchIndexer` gibi arabirimler somut RabbitMQ/EF/Elasticsearch ile çözülür. **Dayanıklılık:** Rabbit kapalıyken null publisher; Elasticsearch kapalıyken client null ve indeks çağrıları no-op; böylece ortam eksik olsa bile API ayağa kalkar.

---

## Mülakat checklist’i (ne kurduk, tek cümle)

| Konu | Anlatım köşesi |
|------|----------------|
| **MediatR** | İstekleri tek girişten handler’lara dağıtır; controller ince kalır, test ve genişleme kolaylaşır. |
| **FluentValidation** | Girdi doğrulama Application/API uzantısı ile tutarlı hata cevapları. |
| **Serilog** | Yapılandırılmış log + istek loglama; gözlemlenebilirlik. |
| **RabbitMQ** | Karakter oluşturma sonrası entegrasyon olayı; gevşek bağlılık (`Enabled` ile kapatılabilir). |
| **Redis / önbellek** | Bağlantı varsa Redis; yoksa dağıtılmış bellek içi fallback; detay okuma için invalidation. |
| **Hangfire + SQL** | Arka plan işleri ve dashboard; şema SQL’de (`PrepareSchemaIfNecessary`). |
| **Dockerfile + Compose** | API imajı ve tüm bağımlılıklar tek compose ile kalkar. |
| **SQL Server konteyner** | Host’tan `localhost,14333`; konteyner içinden `sqlserver,1433`. |
| **İki API replikası + nginx** | `upstream` ile round-robin; dışarıdan tek giriş `localhost:8088`. |
| **Elasticsearch** | Çok alanlı arama read model; CRUD sonrası indeks upsert/delete (`Elasticsearch:Enabled`). |
| **Health** | `GET /health` — LB veya hızlı “yaşıyor mu” kontrolü. |

---

## Portlar ve adresler (compose, host makineden)

| Servis | Host adresi / port |
|--------|---------------------|
| **API (nginx önünde)** | `http://localhost:8088` |
| **SQL Server** | `localhost,14333` |
| **Redis** | `localhost:6379` |
| **RabbitMQ (AMQP / UI)** | `localhost:5672` / `http://localhost:15672` |
| **Elasticsearch** | `http://localhost:9200` |

API konteynerleri doğrudan host portuna map edilmez; trafik nginx üzerinden gider.

---

## Konfigürasyon özeti

- **`appsettings.json`:** Varsayılan bağlantı LocalDB; `Elasticsearch` bölümü genelde `Enabled: false` (güvenli varsayılan).
- **`appsettings.Development.json`:** SQL genelde `localhost,14333`; `Elasticsearch` için `Url` çoğunlukla `http://localhost:9200`. API’yi **IDE’den** çalıştırıp sadece ES’yi Docker’da açacaksan burada `Enabled: true` yapman gerekir.
- **`docker-compose.yml`:** Her iki API için `Elasticsearch__Enabled=true`, `Elasticsearch__Url=http://elasticsearch:9200`; ortam değişkenleri Development dosyasını ezer.

---

## Elasticsearch (tek dosyada özet)

- **Okuma:** `ICharacterSearchReadModel` → Infrastructure’da Elasticsearch üzerinde multi-match (`name`, `universe`, `biography`).
- **Yazma:** `ICharacterSearchIndexer` → create/update sonrası indeks upsert, delete sonrası silme; client yok veya `Enabled: false` ise işlem yapılmaz.
- **HTTP:** `GET /api/characters/search?term=...&size=20` — boş `term` → 400.
- **İndeks adı:** yapılandırmada `CharactersIndex` (varsayılan `characters`).

---

## Yarın test — sırayla (özet tam çıksın diye)

Komutları repoda `BattleArena` klasöründen çalıştır (`docker-compose.yml` burada).

1. **`docker compose build`** (ilk sefer veya Dockerfile değiştiyse).
2. **`docker compose up`** — Elasticsearch’ün kalkması birkaç saniye sürebilir; API `depends_on` ile ES’e bağlı.
3. **Veritabanı:** İlk çalıştırmada migration uygulanmamışsa şema yoktur. Host’tan örnek (SQL port 14333):  
   `dotnet ef database update --project BattleArena.Infrastructure --startup-project BattleArena.Api`  
   (`BattleArena` solution klasöründen; connection string Development ile uyumlu olmalı.)
4. **Sağlık:** Tarayıcı veya araçla `http://localhost:8088/health` → başarılı yanıt.
5. **OpenAPI (Development):** API doğrudan expose edilmediği için Swagger genelde nginx üzerinden route edilmez; gerekirse geçici olarak API’ye host portu eklenir veya IDE’den çalıştırılıp OpenAPI açılır. **Pratik demo:** nginx + REST çağrıları yeterli.
6. **CRUD + arama:** Örnek:
   - `POST http://localhost:8088/api/characters` ile karakter oluştur (gövde proje DTO’suna uygun).
   - `GET http://localhost:8088/api/characters/search?term=oluşturduğun_isim_parçası` — ES açık ve indeks yazıldıysa sonuç gelir.
   - İki kez istek atarak nginx’in farklı replikalara dağıtımını loglardan gözlemlemek mümkün (tam garanti için yük veya tekrar gerekir).
7. **Hangfire:** `http://localhost:8088/hangfire` — dashboard (yetkilendirme prod’da şart; şimdilik demo).

---

## Dürüst sınırlar (sorulunca)

- Compose’daki Elasticsearch **güvenlik kapalı** ve tek düğüm; prod mimarisi farklıdır.
- Hangfire’daki recurring iş **placeholder** olabilir.
- İndeksleme **uygulama içi senkron** çağrı; yüksek ölçekte kuyruk/event ile ayrıştırılabilir.

---

## Önemli kod / dosya işaretleri

| Konu | Yer |
|------|-----|
| DI (EF, Redis, Rabbit, ES, arama) | `BattleArena.Infrastructure/DependencyInjection.cs` |
| ES indeks yazımı | `Infrastructure/Search/ElasticsearchCharacterIndexer.cs` |
| ES arama okuma | `Infrastructure/Search/ElasticsearchCharacterSearchReadModel.cs` |
| Arama sorgusu | `Application/Characters/Queries/SearchCharacters*.cs` |
| HTTP arama | `BattleArena.Api/Controllers/CharactersController.cs` |
| nginx LB | `nginx/default.conf` |
| Compose | `docker-compose.yml` |

Bu dosya güncel tutulursa mülakat öncesi tek PDF/export kaynağı olarak kullanılabilir.
