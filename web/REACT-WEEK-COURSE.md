# Battle Arena `web/` — 7-day React course (≈40 minutes per day)

Use this file **one part per day** (about **40 minutes** of focused reading + skimming code). Path to the app: **`BattleArena/web/`**.

**Before week:** Install deps once: `cd web` → `npm install`. Know that the **.NET API** must run for live data (`VITE_API_BASE_URL` in `.env.development`).

---

## How each day is structured

| Block        | Time (guide) | What to do |
| ------------ | ------------- | ---------- |
| **Orient**   | ~5 min        | Read the day’s goals and bullet list. |
| **Read code**| ~25 min       | Open the listed files **in order**; scroll top-to-bottom; match headings to code. |
| **Try**      | ~10 min       | Optional mini-experiments (safe, reversible). |

---

## Part 1 — Tooling, entry point, and global styles

**Goals:** Understand how this app boots, where environment variables live, and how global CSS affects the UI.

**Topics**

- **Vite** as the dev server and bundler (`vite.config.ts`, `npm run dev`, `npm run build`).
- **Entry:** `index.html` → `src/main.tsx` (first JS that runs).
- **React 19** + **`@vitejs/plugin-react`** (JSX transform, fast refresh).
- **TypeScript** project references (`tsconfig.json`, `tsconfig.app.json`).
- **`:root` / `#root` / `body`** in `src/index.css` — why inherited colors and layout matter (you already hit “washed out” text when `--text` was muted).
- **`src/App.css`** — minimal; most layout lives in components.

**Files (read in this order)**

1. `package.json` — scripts and dependencies.
2. `vite.config.ts`
3. `index.html` (project root of `web/`)
4. `src/main.tsx` — `QueryClient`, `BrowserRouter`, `StrictMode`.
5. `src/index.css` — global tokens and `h1` rules (watch interaction with page components).
6. `src/App.css`

**Try (optional)**

- Run `npm run dev`; change one line in `index.css` (e.g. `--text`) and see the effect.
- Run `npm run build` and `npm run preview` — notice **PROD** badge vs **DEV** (Part 4 ties in).

---

## Part 2 — App composition: `App`, layout shell, and “pages”

**Goals:** See how the UI tree is assembled and where “layout” ends and “page content” begins.

**Topics**

- **`App.tsx`** as the **route table only** (`Routes`, `Route`, `Navigate`).
- **Layout route** pattern: parent `Route` with `element={<AppLayout />}` and **no path** → child routes render inside `<Outlet />`.
- **Index redirect:** `/` → `/characters`.
- **Catch-all:** `path="*"` → 404 page.
- **Folder convention:** `src/pages/` for routable screens (`NotFoundPage`), `src/components/` for shared UI.

**Files**

1. `src/App.tsx`
2. `src/components/AppLayout.tsx` — header, sidebar, `<Outlet />`, footer.
3. `src/components/AppLayout.css` — grid areas, **960px** breakpoint, sidebar slide/scrim.
4. `src/pages/NotFoundPage.tsx` + `NotFoundPage.css`

**Try**

- Visit a nonsense URL (e.g. `/xyz`) and confirm **404** UI.
- Temporarily add a fake `Route` in `App.tsx` and a placeholder component to feel the pattern (then revert).

---

## Part 3 — Client-side routing (React Router v6)

**Goals:** Solid mental model of navigation **without** full page reloads.

**Topics**

- **`BrowserRouter`** (in `main.tsx`) — HTML5 History API.
- **`Routes` / `Route`** — declarative matching.
- **`Navigate`** with **`replace`** — redirect does not stack history entries.
- **`NavLink`** — active styling via `className` callback; `end` prop for exact match.
- **`useLocation`** — here used to **close the mobile sidebar** on every path change.
- **SPA deployment note:** deep links like `/characters` need server fallback to `index.html` in real hosting (Vite preview handles it for local preview).

**Files**

1. `src/main.tsx` — `BrowserRouter` placement (why inside `QueryClientProvider` is fine).
2. `src/App.tsx` — route declarations.
3. `src/components/AppLayout.tsx` — `NavLink`, `Outlet`, `useLocation` effect.

**Try**

- Click **Battle Arena** brand link and sidebar **Characters**; watch URL and active styles.

---

## Part 4 — Environment, responsive shell, and a11y touches

**Goals:** How we show **DEV/PROD**, build responsive layout, and small accessibility habits.

**Topics**

- **`import.meta.env`** — `DEV`, `PROD`, `MODE` (Vite); used in **`EnvironmentBadge`** and footer text.
- **`.env.development`** — `VITE_API_BASE_URL` (only vars prefixed `VITE_` are exposed to client code).
- **Responsive strategy:** mobile-first CSS; **hamburger** + **fixed sidebar** + **scrim**; desktop **persistent** sidebar (`matchMedia('(min-width: 960px)')` in JS + mirrored breakpoint in CSS).
- **`aria-expanded`, `aria-controls`, `aria-hidden`** on menu + sidebar.
- **Escape** closes mobile menu (same idea as `Modal`).

**Files**

1. `src/components/EnvironmentBadge.tsx` + `.css`
2. `src/components/AppLayout.tsx` — state: `sidebarOpen`, `isDesktop`; effects.
3. `src/components/AppLayout.css` — grid template areas, `.app-shell__scrim`, media query.

**Try**

- Resize window across **960px**; open/close menu with **Escape**.
- Compare `import.meta.env` values in dev vs `npm run preview`.

---

## Part 5 — Server state with TanStack Query (React Query)

**Goals:** Why we don’t hand-roll `fetch` + `useEffect` for every list; how cache keys and mutations work.

**Topics**

- **`QueryClient` / `QueryClientProvider`** — app-wide cache and defaults (`staleTime`, `retry`).
- **`useQuery`** — `queryKey`, `queryFn`, `signal` (AbortController for cancelled navigations / Strict Mode).
- **`placeholderData: (prev) => prev`** — keeps old page visible while fetching the next page (pagination UX).
- **`useMutation`** — `mutationFn`, `onSuccess`, `isPending`, `isError`, `error`.
- **`queryClient.invalidateQueries`** — after create/update/delete, **list** (and sometimes **detail**) refetch.
- **Two query types here:** paged list `['characters', page, pageSize]` and detail `['character', id]`.

**Files**

1. `src/main.tsx` — `QueryClient` setup.
2. `src/components/CharactersGrid.tsx` — all `useQuery` / `useMutation` / `invalidateQueries` (read slowly; this file is the “spine”).

**Try**

- In DevTools **Network**, paginate and watch **cancelled** vs completed requests.
- After saving a character, confirm a **second** GET list request (invalidation).

---

## Part 6 — TanStack Table, modals, and controlled forms

**Goals:** Table as a **headless** UI library; modals for CRUD; controlled inputs.

**Topics**

- **`useReactTable`** — `data`, `columns`, `getCoreRowModel`, **manual pagination** (`pageCount`, server-driven `totalCount`).
- **`createColumnHelper`** — typed columns; **display column** for **Actions** (no accessor field).
- **`Modal`** — backdrop click, **Escape**, `role="dialog"`, `aria-modal`.
- **`CharacterFormFields`** — **controlled** pattern: `values` + `onChange` (single object state in parent).
- **Helpers:** `emptyCharacterForm`, `detailToForm`, `valuesToBody` — mapping UI ↔ API.
- **`useLayoutEffect`** — syncing edit form when detail arrives (avoid one-frame flash).

**Files**

1. `src/components/Modal.tsx` + `Modal.css`
2. `src/components/CharacterFormFields.tsx`
3. `src/components/CharactersGrid.tsx` — columns, table setup, modal wiring.
4. `src/components/CharactersGrid.css` — table + action buttons + density.

**Try**

- Trace one **Edit** click: which query runs, when `form` state updates, which mutation runs.

---

## Part 7 — API module, TypeScript types, and user-readable errors

**Goals:** Clean boundary between React components and HTTP; typing JSON; friendly errors.

**Topics**

- **`apiBase()`** — trim trailing slash; compose URLs with `URL` + `searchParams`.
- **`fetch`** patterns — `POST`/`PUT` JSON body; **`204 No Content`** on update/delete (no JSON body).
- **Types** mirroring .NET DTOs — `CharacterRow`, `PagedCharacterRowsResult`, `CharacterDetail` (`src/types/characters.ts`).
- **`formatApiErrorBody`** — parse ASP.NET **Problem Details** + `errors` dictionary; field labels; strip FluentValidation’s `'Property'` prefix; **`white-space: pre-line`** in UI for multi-line messages.
- **404** handling — distinct messages for missing character vs validation errors.

**Files**

1. `src/types/characters.ts`
2. `src/api/charactersApi.ts`
3. `src/api/formatApiError.ts`
4. Skim `CharactersGrid.tsx` error `<p>` usage (how `Error.message` is shown).

**Try**

- Trigger a **validation error** (e.g. rarity out of range) and read the formatted message end-to-end.

---

## End-of-week checklist (you should be able to answer these)

1. Why is `BrowserRouter` in `main.tsx` and not buried inside a random component?
2. What does `<Outlet />` render, and who decides *what*?
3. Why do we use **`invalidateQueries`** after a successful mutation?
4. What is the difference between **`useQuery`** and **`useMutation`** in this project?
5. Why did global **`color` on `:root`** make the table look “faint”?
6. What problem does **`formatApiErrorBody`** solve for users?
7. Where would you add a **second** sidebar link when a new route exists?

---

## Related doc

`REACT-LEARNING.md` (if present) may overlap; this **7-part** file is the **time-boxed** path. **`ProjectQandA.md`** (under `BattleArena.Api/`) explains backend + CQRS context that the React app talks to.

Happy reading next week — **one part per day** is enough; depth beats speed.
