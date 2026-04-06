# Project Q&A (notes from design discussions)

Authoring rules for future answers in this doc: use short bullets or plain paragraphs; for two-way comparisons use two columns with numbered rows (Topic A | Topic B). Avoid decorative formatting.

---

## Batch 1

### 1. Should every property on an entity be nullable? Can we mark required ones in code only and still save to the database without errors?

- Making everything nullable is usually not a good default. It spreads uncertainty through the code: callers must null-check even when the business says the value always exists after creation.
- In C#, `string?` means the compiler warns you when you might use null unsafely. `string` (non-nullable) documents intent: this must be present in valid aggregates.
- The database is a separate layer. You enforce non-null with NOT NULL columns and sensible defaults. If C# allows null but the column is NOT NULL, you get a runtime error at save time. If both align (non-nullable reference type + NOT NULL), you catch mistakes earlier.
- Practical approach: required domain fields = non-nullable types + DB NOT NULL; optional fields = nullable types + DB NULL allowed. Validation (FluentValidation) and factory methods add another line of defense before persistence.

### 2. Why is `Create` static and why does it use `new Character` inside? Benefit to the project? Could we add another constructor and let everyone use it?

- A private parameterless constructor exists for EF Core materialization. If you add a public constructor with parameters, any code could construct invalid states (e.g. empty name) without going through rules you add later.
- A static factory (`Create`) is one place to enforce invariants and to document: “this is how you build a valid `Character`.” The method can stay small now and grow (validation, defaults, domain events) without multiplying constructors.
- You could use a public constructor instead of a static factory; both can work. The factory pattern is common in DDD samples because it keeps construction rules in one named entry point and avoids many overloaded constructors.
- If you add another public constructor, yes, everyone could use it unless you keep constructors private and only expose factories. That is a deliberate design choice.

### 3. Revisit DDD and CQRS folder layout: wouldn’t separate Command and Query folders under Application be cleaner than mixing under `Characters`?

- Separating **Commands** and **Queries** (per feature or per bounded context) is a valid and readable layout. Someone opening `Characters/Commands` and `Characters/Queries` immediately sees CQRS split.
- Putting all character use cases in one `Characters` folder is also valid for small modules: less nesting, everything for that feature in one place.
- DDD does not mandate a specific folder tree. CQRS is about separating read and write models at the design level; folders are for human navigation. Choose one convention and keep it consistent across modules.

| Feature-first (current style) | CQRS split folders |
| --- | --- |
| 1. One folder per aggregate/feature; commands and queries live together. | 1. Under each feature (or module), `Commands` and `Queries` subfolders. |
| 2. Fewer clicks for small features. | 2. Scales well when many handlers exist per feature. |
| 3. Name files clearly (`CreateCharacterCommand`, `GetCharactersQuery`) so CQRS is still obvious. | 3. Structure repeats the command/query boundary in the tree. |

### 4. What do `record` types give us? Aren’t records like classes? Could we use classes? Does `: IRequest<Guid>` mean “implements”?

- `record` in C# is still a type; for class records it is reference-type with value-based equality, `with` expressions, and concise positional syntax for immutable data.
- For MediatR messages (commands/queries), **immutability** and **clear equality** matter less than clarity and brevity. Records are popular for DTOs and messages because they are short and read-only by convention.
- You can use `class` for commands and queries; MediatR does not require `record`. Pick one style per project and stay consistent.
- `: IRequest<Guid>` means the type **implements the `IRequest<Guid>` interface** (primary constructor syntax for records/classes implements interfaces the same way). MediatR uses that to find the handler return type.

### 5. Using `record` for `GetCharactersQuery` and `PagedCharacterRowsResult` instead of `class`—does that create a dimensional hierarchy?

- No. There is no inheritance hierarchy implied between those records. They are separate types. `record` here is mostly syntax and immutability semantics, not a “layer” or dimension.
- `GetCharactersQuery` is the request; `PagedCharacterRowsResult` is the response shape. The relationship is logical (handler input/output), not a type hierarchy.

### 6. Should handlers live in their own folder? (Follow-up to Q3.) What is reasonable for “best practice” file layout?

- Handlers are often placed next to the command/query (`CreateCharacterCommandHandler` next to `CreateCharacterCommand`) so the vertical slice is obvious.
- Alternatively: `Commands/CreateCharacter/CreateCharacterCommand.cs` + `CreateCharacterCommandHandler.cs` + validator in the same folder, or `Handlers` subfolder if you prefer strict separation.
- “Best practice” here means **consistent, navigable structure** and **thin handlers** that delegate domain rules to entities. Folder depth is a team preference.

| Co-locate command + handler | Separate `Handlers` folder |
| --- | --- |
| 1. One place to change when the use case evolves. | 1. All handlers grouped by role. |
| 2. Very common in MediatR examples. | 2. Can feel scattered for small features. |

### 7. Why server-side paging (short)?

- The database returns only one page of rows (e.g. 20) instead of the entire table. That keeps memory, network payload, and serialization cost bounded as data grows. Client-side paging of huge lists does not scale.

### 8. “Paging” vs “pagination”—same thing? Is one broader?

- People use both terms interchangeably for “splitting results into pages.”
- Sometimes “pagination” is used for the whole mechanism (UI controls, API contract, total count, links), while “paging” is used for the low-level `Skip`/`Take` or SQL `OFFSET`/`FETCH`. There is no strict standard; meaning depends on context. Your idea that one is “broader” is loosely true in documentation language but not a formal rule.

### 9. Explanation of `GetCharactersQueryHandler.Handle` (step by step)

- The method implements MediatR’s handler contract: given a `GetCharactersQuery` and a cancellation token, it returns a `PagedCharacterRowsResult`.
- `page` is forced to at least 1 so invalid zero or negative page values do not break `Skip`.
- `pageSize` is clamped between 1 and 200 so callers cannot request huge pages that would stress the server or database.
- `_db.Characters.AsNoTracking()` builds a read-only query: EF does not track these entities for changes, which is cheaper for lists.
- `OrderByDescending(c => c.CreatedAtUtc)` defines stable ordering (newest first) so paging is predictable.
- `CountAsync` runs a query that returns how many rows match **before** paging. That number is the total for the grid (“page 1 of N”).
- `Skip((page - 1) * pageSize)` skips rows for all previous pages. Page 1 skips 0; page 2 skips one page worth, etc.
- `Take(pageSize)` limits how many rows are returned for this page.
- `Select(...)` projects each entity into `CharacterRowDto` in the database query when possible (efficient shape for the API).
- `ToListAsync` executes the query and materializes the page into memory.
- The method returns a new `PagedCharacterRowsResult` wrapping the items and the total count so the client can render the grid and pagination UI.

---

## Batch 2

### 1. What is `sealed class` and what value does it add to our architecture?

- `sealed` means the class cannot be inherited.
- In this project, it helps keep behavior explicit: handlers/behaviors/entities are used as designed, not altered through subclassing.
- It reduces extension points that can create hidden side effects in DI-heavy systems.
- It is not mandatory; we use it as a guardrail for predictable code.

### 2. What is `RequestHandlerDelegate<TResponse>` and what does it contribute?

- It is the "next step" function in MediatR pipeline behaviors.
- Inside `ValidationBehavior`, calling `await next()` means "continue to the next behavior or final handler."
- Contribution: enables middleware-like chaining (validation, logging, transaction, etc.) around handlers without modifying each handler.

### 3. What is `where TRequest : notnull`?

- It is a generic constraint.
- It tells the compiler `TRequest` must not be nullable.
- This aligns with MediatR expectations and avoids nullable warnings/edge cases in pipeline code.

### 4. Explanation of the full `ValidationBehavior<TRequest, TResponse>` block

- This class is a MediatR pipeline behavior, so every request passes through it before the handler.
- It receives all validators registered for the current request type via DI (`IEnumerable<IValidator<TRequest>>`).
- If there are no validators, it immediately calls `next()` and does nothing else.
- If validators exist, it builds a `ValidationContext<TRequest>` and runs all validators.
- It flattens all validation errors into one list.
- If there is at least one error, it throws `ValidationException` and stops the pipeline.
- If no errors exist, it calls `next()` so the actual handler executes.
- Net effect: handlers stay cleaner because input validation is centralized.

### 5. `AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>))` and Transient meaning

- `Transient` creates a new instance each time it is requested from DI.
- For pipeline behaviors, this is common and usually fine because they are stateless.
- Think of it as "lightweight, per-resolution object," not strictly "per HTTP request."
- `Scoped` is per request scope; `Singleton` is app-wide single instance.
- Here, `Transient` is a safe default for validation behavior.

### 6. `DbSet<Character> Characters => Set<Character>();` and `OnModelCreating` questions

- `Characters => Set<Character>()` is not `override`.
- It is an expression-bodied property that exposes EF Core's internal set for `Character`.
- It also fulfills `IApplicationDbContext` contract (`DbSet<Character> Characters { get; }`).

- `protected override void OnModelCreating(ModelBuilder modelBuilder)`:
  - `override` means it replaces/extents the virtual method from `DbContext`.
  - `protected` means only this class and derived classes can call it directly.
  - We override it to apply entity configurations (`ApplyConfigurationsFromAssembly`).

### 7. `AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<ApplicationDbContext>())` and "Windows 10 syntax"

- This is not related to Windows version.
- It is standard modern ASP.NET Core DI syntax.
- Meaning: when code asks for `IApplicationDbContext`, provide the current scoped `ApplicationDbContext` instance.
- This keeps Application layer dependent on abstraction while Infrastructure provides concrete implementation.

### 8. Why we added specific packages to Application and Infrastructure

| Application packages | Why |
| --- | --- |
| 1. `MediatR` | Command/query request-response pipeline and handlers. |
| 2. `FluentValidation` | Strong input validation rules for requests. |
| 3. `FluentValidation.DependencyInjectionExtensions` | Auto-register validators via DI scanning. |
| 4. `Microsoft.EntityFrameworkCore` | `DbSet<>` type needed by `IApplicationDbContext`. |
| 5. `Microsoft.Extensions.DependencyInjection.Abstractions` | `IServiceCollection` used by `AddApplication`. |

| Infrastructure packages | Why |
| --- | --- |
| 1. `Microsoft.EntityFrameworkCore.SqlServer` | SQL Server provider + `UseSqlServer`. |
| 2. `Microsoft.Extensions.Configuration.Abstractions` | `IConfiguration` used by `AddInfrastructure`. |

### 9. Why `builder.Services.AddOpenApi();` was added

- It enables OpenAPI document generation for the API.
- In development, it allows endpoint discovery/testing more quickly.
- It helps frontend integration because request/response contracts are visible and testable.

### 10. "We will change DB when creating migrations"

- Correct. Connection string is configuration, not domain logic.
- We can switch from LocalDB to your target SQL Server before first migration.
- Recommended order:
  - 1. Set final connection string.
  - 2. Create migration.
  - 3. Update database.
- If migration was created with wrong connection, recreate or add corrective migration.

---

## Application folder layout (CQRS split)

This matches the “CQRS split folders” option discussed in Batch 1, question 3.

- `BattleArena.Application/Characters/Commands/` — write side: `CreateCharacterCommand`, `CreateCharacterCommandValidator`, `CreateCharacterCommandHandler`
- `BattleArena.Application/Characters/Queries/` — read side: `GetCharactersQuery` (includes `CharacterRowDto`, `PagedCharacterRowsResult`), `GetCharactersQueryHandler`

Namespaces: `BattleArena.Application.Characters.Commands` and `BattleArena.Application.Characters.Queries`. MediatR still discovers handlers from the Application assembly via `AddApplication()`.

---

## Batch 3

### 1. Middleware order: `UseFluentValidationExceptionHandler`, `UseHttpsRedirection`, `UseCors`, `UseAuthorization`, `MapControllers`, `Run`

- In ASP.NET Core, the first middleware you register is the **outermost** wrapper around everything that follows.
- Our `FluentValidationExceptionMiddleware` does **not** validate the HTTP request at the very start of the lifecycle. FluentValidation runs later, inside the app (MediatR pipeline → `ValidationBehavior` → validators) when a controller/handler executes.
- That middleware is placed **first** so it wraps `await _next(context)` in a **try/catch**. If a `ValidationException` is thrown **deeper** in the pipeline (after routing reaches your API), the exception unwinds through `next` and is caught here to return **400** with a problem JSON body.
- So the reason for “first” is **exception handling scope** (outer catch), not “validate before anything runs.”
- Typical order rationale (short):
  - Exception-handling outer shell early (what we did).
  - HTTPS redirection before most other logic.
  - CORS must run **before** the browser-enforced preflight/response headers matter; placing it before endpoints is standard.
  - AuthZ runs before endpoints are executed.
  - `MapControllers` registers endpoint execution; `Run` starts the server.

### 2. `ApplicationBuilderExtensions`: one class for many middlewares, or one class per middleware?

- Both are valid. Common team styles:
  - One static class (e.g. `ApplicationBuilderExtensions`) with multiple `UseSomething(this IApplicationBuilder app)` methods.
  - Or separate small classes/files per middleware if each has substantial setup.
- For a few lines per concern, grouping extensions in one class keeps `Program.cs` readable. If a middleware grows (options, env checks), split it out.

| One extensions class | Separate extension classes |
| --- | --- |
| 1. Fewer files; all `UseX` discoverable in one place. | 1. Clear ownership per middleware/feature. |
| 2. Good for small APIs. | 2. Better when many pipelines differ by environment. |

### 3. What `Program.cs` CORS block does (lines ~10–19)

- `AddCors` registers CORS services into DI.
- `AddDefaultPolicy` defines the **default** named policy the app will use when you call `UseCors()` with no policy name.
- `WithOrigins("http://localhost:5173", "https://localhost:5173")` allows browser calls from a local Vite dev server (HTTP or HTTPS).
- `AllowAnyHeader()` allows headers like `Content-Type`, `Authorization`, etc., from those origins.
- `AllowAnyMethod()` allows GET/POST/OPTIONS (preflight) and other verbs you need during development.
- Production should replace the wildcard-style allowances with a tighter origin list and often stricter headers/methods.

### 4. What is `BattleArena.Api.http`? Why use `.http` files?

- It is a **simple REST request script** for IDEs (Visual Studio **.http** / **REST Client**, JetBrains **HTTP Client**).
- You can run requests (GET/POST) against your API **without** Postman/Swagger UI, useful for quick checks and sharing examples with the team.
- It is **not** executed by the server; it is a **developer tool** file checked into the repo for convenience.

### 5. What is `Type` in `ValidationProblemDetails` (FluentValidation middleware)?

- `Type` is a **URI string** that identifies the problem category for clients and humans (part of **Problem Details** / RFC 7807 style responses).
- We set it to `https://tools.ietf.org/html/rfc7231#section-6.5.1`, which points to documentation about **400 Bad Request** semantics in HTTP semantics.
- It is **not** the exception type name; it is a **stable documentation link** (you can later replace it with your own API documentation URI per error type).

---

## Notes for project overseer (controller / layers)

Purpose: align review expectations with the same direction as the MeetingRoom “ReservationSeries-style” CQRS sample (MediatR, handlers, validation pipeline), not legacy fat controllers.

- **Controller responsibility:** HTTP only—bind query/body, call `IMediator.Send(...)`, return status codes and DTO shapes. No business rules in the controller.
- **Application layer:** Commands/queries + handlers + FluentValidation live in `BattleArena.Application`. Each handler is the use-case orchestrator (equivalent role to a small application service per operation).
- **Persistence abstraction:** Application depends on `IApplicationDbContext`; Infrastructure implements it with EF Core. We are **not** requiring a separate `IRepository` per aggregate unless a use case needs it (test isolation, complex read ports, or swapping storage).
- **Optional service interface between controller and MediatR:** Not the default—would duplicate the handler. Consider only if the same orchestration must be invoked from non-HTTP entry points (background job, message consumer) and you want one shared façade.
- **Consistency with MeetingRoom:** Prefer the **CQRS module** pattern (feature folders, commands/queries, behaviors) as the reference; older scaffold-style controllers are not the template for new endpoints here.

---

## Character grid API (quick reference)

- **GET** `http://localhost:5084/api/characters?page=1&pageSize=20` (adjust host/port if your launch profile differs).
- **Response shape:** `PagedCharacterRowsResult` — `items` (rows) + `totalCount` (for pagination UI).
- **Next frontend step:** Vite + React + TanStack Table in a separate `web/` folder calling this GET (and POST for create when needed).

### Can we see the grid without running migrations?

- **End-to-end with real data:** **No.** The handler queries SQL Server through EF Core. If the `Characters` table (and schema) does not exist, the request typically fails at runtime with a SQL/EF error (e.g. invalid object name).
- **UI-only:** **Yes, partially.** You can still build the React grid and show an empty table, a loading state, or an error message when the API call fails—useful for layout work, but not a substitute for a working read API.
- **Demos without SQL (optional, not current setup):** Using an **in-memory** EF provider for development would let the GET succeed without SQL migrations, but that is a different configuration and not what the repo is wired for today.

**Reminder:** Apply EF migrations (or `database update`) against the configured `DefaultConnection` before expecting the grid GET to return successful JSON with data.

---

## LocalDB connection string (dev)

`BattleArena.Api/appsettings.json`:

- `ConnectionStrings:DefaultConnection` = `Server=(LocalDb)\MSSQLLocalDB;Database=BattleArena;Trusted_Connection=True;TrustServerCertificate=True;`

Adjust instance name if your machine uses a different LocalDB name.

---

## Remote SQL Server (login/password) — User Secrets (do not commit passwords)

**Security:** Never put SQL passwords in `appsettings.json` if the repo is shared or public. This project has a **UserSecretsId** on `BattleArena.Api` so you can store the connection string only on your machine.

**Who creates the database?**

- **Often you create the empty database first** (SSMS: right-click Databases → New Database, or your host’s panel). Name it e.g. `BattleArena` (or whatever your team uses). The SQL login must be `db_owner` (or at least DDL rights) on **that** database.
- **Sometimes** the login has `dbcreator` on the server: then `dotnet ef database update` may run `CREATE DATABASE` for the name in the connection string. Many corporate/shared servers **do not** allow that — then you **must** create the database manually first.
- **Either way, EF migrations create/update tables** (`Characters`, `__EFMigrationsHistory`, etc.) inside the database you point to with `Database=...`.

**Connection string shape (SQL authentication):**

`Server=YOUR_SERVER;Database=YOUR_DB;User Id=YOUR_USER;Password=YOUR_PASSWORD;TrustServerCertificate=True;Encrypt=True;`

- Replace `YOUR_SERVER` with the real host (e.g. `localhost`, `192.168.x.x`, `machine\INSTANCE`, or a cloud host). If `ServerName` in your notes is actually the **database** name, put that value in `Database=`, not in `Server=`.
- `TrustServerCertificate=True` is common in dev when the server uses a self-signed cert.

**Store with User Secrets (from `BattleArena/` folder):**

```bash
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=...;Database=...;User Id=...;Password=...;TrustServerCertificate=True;Encrypt=True;" --project BattleArena.Api
```

Run **`database update`** (same EF commands as below) so schema applies to that server.

### User Secrets — summary of what we configured (this repo)

- **`BattleArena.Api.csproj`** contains `<UserSecretsId>...</UserSecretsId>` so this API project has its own secret store on your PC (not in git).
- **Purpose:** store `ConnectionStrings:DefaultConnection` (e.g. SQL login/password) **only locally**, overriding `appsettings.json` when the app runs in **Development**.
- **Set a secret (recommended folder: `BattleArena/`, i.e. parent of `BattleArena.Api`):**

```bash
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=...;Database=...;User Id=...;Password=...;TrustServerCertificate=True;Encrypt=True;" --project BattleArena.Api
```

- **If your terminal’s current directory is already `BattleArena.Api/`,** use the `.csproj` file name so dotnet does not look for a wrong path:

```bash
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=...;" --project BattleArena.Api.csproj
```

- **List secrets (verify):** `dotnet user-secrets list --project BattleArena.Api` (from `BattleArena/`) or `--project BattleArena.Api.csproj` (from `BattleArena.Api/`).
- **Physical location (Windows, optional):** `%APPDATA%\Microsoft\UserSecrets\<UserSecretsId>\secrets.json` — do not copy this into the repo.
- **Reminder:** never paste production passwords into chat or commit them; rotate if exposed.

---

## EF Core migrations — what they are, and where to run commands

### What is a migration?

- A **migration** is a **versioned C# + SQL snapshot** of your EF model: it describes how to create or alter tables (e.g. `Characters`, indexes) and records what was applied in **`__EFMigrationsHistory`** inside the database.
- **`migrations add`** = generate **new** migration files from the current model (when you change entities/config). You commit those files to git.
- **`database update`** = apply **pending** migrations to the database pointed to by **`ConnectionStrings:DefaultConnection`** (LocalDB, or your SQL Server via User Secrets — same command).

Changing the connection string does **not** require deleting old migrations; `database update` simply runs against the **new** database next time.

### Where to run commands? (working directory)

**Recommended:** open the terminal in **`D:\BattleArenaAndFigures\BattleArena`** — the folder that **contains both** `BattleArena.Api` and `BattleArena.Infrastructure` as subfolders.

Then use:

- `--project BattleArena.Infrastructure` → where the `DbContext` and `Migrations` folder live.
- `--startup-project BattleArena.Api` → loads configuration (including **User Secrets** in Development) and references so EF tools can build the host.

**Türkçe kısa:** Komutları **`BattleArena` klasöründe** çalıştır (Api ve Infrastructure’un üst klasörü). `BattleArena.Api` içindeysen `--project` için **`.csproj` dosya adını** kullan (`BattleArena.Api.csproj` veya `..\BattleArena.Infrastructure\BattleArena.Infrastructure.csproj` gibi yollar net olmalı).

### Commands (from `BattleArena/`)

**Prerequisite (once per machine):** EF CLI tools

- `dotnet tool install --global dotnet-ef`
- If already installed but outdated: `dotnet tool update --global dotnet-ef`

**Add a new migration** (only when the model changed; creates files under `BattleArena.Infrastructure/Persistence/Migrations/`):

- `dotnet ef migrations add <Name> --project BattleArena.Infrastructure --startup-project BattleArena.Api --output-dir Persistence\Migrations`

**Apply migrations to the database** (uses current `DefaultConnection` — appsettings + User Secrets in Development):

- `dotnet ef database update --project BattleArena.Infrastructure --startup-project BattleArena.Api`

**Remove last migration** (only if not applied to important databases, or after careful review):

- `dotnet ef migrations remove --project BattleArena.Infrastructure --startup-project BattleArena.Api`

### Notes

- `Microsoft.EntityFrameworkCore.Design` is referenced on **BattleArena.Api** (startup) and **BattleArena.Infrastructure** so `dotnet ef` can discover the `DbContext` and build the model.
- If the tools warn the CLI version is older than the runtime, update `dotnet-ef` with the command above.
- This repo already includes **`InitialCreate`** for the `Characters` table; on a **new** SQL database, run **`database update` once** so tables exist.

---

## Frontend (`web/`) — Vite + React + grid

Location: `BattleArena/web` (Vite React + TypeScript).

**Stack:** `@tanstack/react-table` for the grid, `@tanstack/react-query` for server-state and caching.

**Config:** `web/.env.development` sets `VITE_API_BASE_URL=http://localhost:5084` (match your API launch profile port if different).

**Run (two terminals):**

1. API: from `BattleArena/`, run `dotnet run --project BattleArena.Api` (or F5 in Visual Studio).
2. Web: from `BattleArena/web/`, run `npm run dev` and open the printed local URL (usually `http://localhost:5173`).

**CORS:** `Program.cs` allows `http://localhost:5173` and `https://localhost:5173` for development.

**What the page does:** `GET /api/characters?page=&pageSize=` with Previous/Next, page-size select, and Refresh. Empty database shows an empty grid message until you POST sample data (see `BattleArena.Api.http`).

**Longer React/Vite/TanStack walkthrough (commands + every `src` file):** see `web/REACT-LEARNING.md`.
