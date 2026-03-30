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
