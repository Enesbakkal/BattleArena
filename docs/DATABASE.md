# Database (BattleArena)

## Connection (host: `dotnet run`, EF, Hangfire)

- **Server:** `KLABAUTERMANN\MSSQL2024`
- **Database:** `BattleArena`
- **Login:** `EBBankingAppDB` (SQL auth)
- **Config:** `appsettings.json` (Production / `dotnet run` http profili)
- **Ortam:** `ASPNETCORE_ENVIRONMENT=Production` (`launchSettings` http/https)

Hangfire uses the same `DefaultConnection` — no separate Hangfire DB config.

## Senin sıran (Production)

1. SSMS: sunucu `KLABAUTERMANN\MSSQL2024`, login `EBBankingAppDB`
2. Gerekirse: `CREATE DATABASE BattleArena;`
3. Migration:
   ```powershell
   cd "d:\BattleArenaAndFigures\BattleArena\BattleArena.Infrastructure"
   $env:ASPNETCORE_ENVIRONMENT="Production"
   dotnet ef database update
   ```
4. API:
   ```powershell
   cd "d:\BattleArenaAndFigures\BattleArena"
   dotnet run --project BattleArena.Api --launch-profile http
   ```
5. Tarayıcı: `http://localhost:5084/health` · `http://localhost:5084/hangfire`

İlk kez: SQL’de `BattleArena` veritabanının var olduğundan emin ol.

## Docker Compose API → host SQL

Host’ta `dotnet run` named pipe / shared memory ile `KLABAUTERMANN\MSSQL2024`’e gidebilir; **konteyner TCP ister**.

1. **SQL Server Configuration Manager** → SQL Server Network Configuration → **Protocols for MSSQL2024** → **TCP/IP = Enabled** → instance restart.
2. TCP/IP → Properties → **IPAll** → **TCP Dynamic Ports** boş, **TCP Port** = örn. `14330` → restart `MSSQL2024`.
3. **Windows Firewall**: gelen kural `14330` (veya seçtiğin port).
4. Proje kökünde `.env.example` → `.env` kopyala; `SQL_SERVER_HOST` = `ping host.docker.internal` IPv4 (ör. `192.168.1.124`), `SQL_SERVER_PORT` = adım 2’deki port.
5. `docker compose up -d --force-recreate battlearena.api battlearena.api-2`

SSMS’te port doğrula (TCP açık oturum):

```sql
SELECT local_net_address, local_tcp_port
FROM sys.dm_exec_connections
WHERE session_id = @@SPID;
```

Hâlâ istemezsen: API’yi host’ta `dotnet run` (5084); compose’ta sadece redis/rabbit/ES/nginx.

## Eksik / kontrol listesi

- [ ] `EBBankingAppDB` login’in `BattleArena` DB’sinde `db_owner` veya en azından DDL/DML yetkisi
- [ ] SQL Server Authentication (mixed mode) açık
- [ ] `MSSQL2024` instance çalışıyor
- [ ] Migration uygulandı (`__EFMigrationsHistory` + `Characters` tablosu)
- [ ] Hangfire tabloları ilk API start’ta oluşur (`PrepareSchemaIfNecessary`)
