# React + Vite + TanStack — Q&A walkthrough (this repo)

This document explains **what we installed**, **why**, and how **each `.ts` / `.tsx` file** fits together in `BattleArena/web`. It is written to be readable top-to-bottom (big, but sectioned).

---

## Part A — Commands we used (and why)

### 1) Create the Vite + React + TypeScript app

**Command (run from `BattleArena/`):**

`npm create vite@latest web -- --template react-ts`

**Why Vite?**

- **Fast dev server** (quick refresh while you edit).
- **Modern bundling** for production builds.
- **Simple config** compared to older toolchains.

**Why `react-ts` template?**

- **TypeScript** catches mistakes early (API shapes, missing props, wrong types).
- `.tsx` files let you write **typed JSX** (HTML-like syntax inside JavaScript).

### 2) Install dependencies

**Commands (from `BattleArena/web/`):**

- `npm install`
- `npm install @tanstack/react-query @tanstack/react-table`

**Why `npm install` first?**

- Downloads everything listed in `package.json` (React, Vite tooling, TypeScript, etc.).

**Why TanStack Query (`@tanstack/react-query`)?**

- Your grid needs **server data** (HTTP). Query libraries handle:
  - **loading / error states**
  - **caching**
  - **refetch** (Refresh button)
  - **deduping** duplicate requests
- Without it, you would manually write a lot of `useEffect` + `fetch` boilerplate.

**Why TanStack Table (`@tanstack/react-table`)?**

- A **headless** table engine: column definitions, row model, rendering hooks.
- It does **not** draw a pretty UI by itself; you render `<table>` HTML and use its helpers (`flexRender`, etc.).
- Good fit for **data grids** and later **sorting/filtering** features.

### 3) Run the app

**From `BattleArena/web/`:**

- `npm run dev` — development server (hot reload).
- `npm run build` — typecheck + production bundle.

**Why `npm run build` matters?**

- Ensures TypeScript is happy before you deploy or share the project.

---

## Part B — Big picture: how a React app starts in the browser

Think of the app as a **tree**:

1. Browser loads `index.html` (Vite template).
2. `index.html` loads a single JS entry (the bundled output of `src/main.tsx`).
3. `main.tsx` creates the React root and renders `<App />`.
4. `App.tsx` composes UI from smaller components (here: `CharactersGrid`).
5. `CharactersGrid` calls your API and renders rows.

**Rule of thumb:** data flows **down** (props), events flow **up** (callbacks). Libraries like Query add a **side channel** for server state (cache), which reduces prop drilling for remote data.

---

## Part C — `.ts` vs `.tsx` (TypeScript in this project)

| Extension | Typical use in this repo |
| --- | --- |
| `.ts` | Plain TypeScript modules: types, API helpers, utilities. **No JSX** here. |
| `.tsx` | React components and the entry file that renders JSX (`<App />`, `<table>...</table>`). |

**Why separate them?**

- Keeps **pure logic** (fetch, types) easy to test and reuse.
- Keeps **UI files** focused on rendering.

---

## Part D — File tree (what exists under `src/`)

```
src/
  main.tsx                 # Entry: mounts React + Query provider
  App.tsx                  # Top-level page layout (currently only grid)
  App.css                  # Styles for App shell
  index.css                # Global styles (Vite template baseline)
  types/
    characters.ts          # TypeScript shapes matching API JSON
  api/
    charactersApi.ts       # fetch() wrapper for /api/characters
  components/
    CharactersGrid.tsx       # Grid UI + Query + Table wiring
    CharactersGrid.css       # Grid/table styles
  assets/                  # SVG logos (template leftovers; optional)
```

Below, each file is explained in **dependency order** (entry → leaves).

---

## Part E — Hierarchical explanation (each file)

### 1) `index.html` (project root, not under `src/`)

**Role:** The only real HTML page. It contains `<div id="root"></div>` where React attaches.

**Why it matters:** React does not generate a full HTML site per route by default in this setup; it **hydrates/mounts** into one DOM node.

---

### 2) `src/main.tsx`

**Role:** The **JavaScript entry point**.

**What it does (conceptually):**

- Creates a React root: `createRoot(document.getElementById('root')!)`.
- Wraps the app with **`QueryClientProvider`** so any child component can use `useQuery`.
- Renders `<App />`.

**Why `QueryClientProvider` is here (high level):**

- TanStack Query stores caches and request state in a **QueryClient** object.
- The provider puts that client into React context so hooks work anywhere below it.

**Why `StrictMode`:**

- React development helper that intentionally double-invokes some lifecycles in dev to surface unsafe side effects. Ignore the details early; keep it on for learning projects.

---

### 3) `src/App.tsx`

**Role:** The **top-level component** for the UI tree (your “page”).

**What it does here:**

- Imports `CharactersGrid`.
- Returns `<main><CharactersGrid /></main>`.

**React idea:** `App` is just a function that returns **elements**. React calls it and reconciles output to the DOM.

**Why keep `App` even if it is small?**

- Real apps grow: routing, layout, headers, auth wrappers. `App` becomes the composition root.

---

### 4) `src/App.css` and `src/index.css`

**Role:** Stylesheets.

- `index.css` is usually global baseline (body, fonts).
- `App.css` styles the shell around your feature.

**React note:** CSS imports are bundled by Vite; they are not “React features,” just normal web styling.

---

### 5) `src/types/characters.ts`

**Role:** **Type-only** definitions for JSON you expect from the API.

**Why it exists:**

- The server returns JSON. TypeScript does not know the shape unless you declare it.
- Centralizing types prevents copying string keys all over the UI.

**Concepts:**

- `export type CharacterRow = { ... }` describes one grid row.
- `export type PagedCharacterRowsResult = { items, totalCount }` describes pagination envelope.

**Important realism note:**

- Types do not validate at runtime. If the API changes, TypeScript won’t automatically save you unless you update types or add runtime validation (optional advanced step).

---

### 6) `src/api/charactersApi.ts`

**Role:** **API boundary** — one function that knows how to call your backend.

**What `fetchCharactersPage` does:**

- Builds URL with query string `page` and `pageSize`.
- Calls `fetch`.
- Throws on non-OK responses (so React Query marks the query as error).
- Parses JSON into your typed shape.

**Why `import.meta.env.VITE_API_BASE_URL`:**

- Vite exposes env vars prefixed with `VITE_` to the browser bundle.
- `.env.development` sets the dev API base URL without hardcoding in source.

**Why keep API calls out of components:**

- Components stay readable.
- You can reuse the same call from another screen later.
- Easier to mock in tests.

---

### 7) `.env.development`

**Role:** Development configuration for Vite.

**Why not commit secrets here:**

- This file is for **non-secret dev defaults** (localhost URLs).
- Never put production passwords/tokens in client-side env vars (they ship to the browser).

---

### 8) `src/components/CharactersGrid.tsx`

**Role:** The **feature UI** for listing characters.

**Major React pieces inside:**

#### a) `useState` for pagination

- Holds `{ pageIndex, pageSize }` in component state.
- When state changes, React **re-renders** the component.

#### b) `useQuery` (TanStack Query)

- `queryKey: ['characters', page, pageSize]` identifies this server request in the cache.
- When `page` or `pageSize` changes, Query refetches automatically.
- `queryFn` calls your `fetchCharactersPage`.
- `placeholderData: (prev) => prev` keeps old rows visible briefly while fetching the next page (less flicker).

**Mental model:** `useQuery` is a hook that returns `{ data, isLoading, error, refetch, ... }`.

#### c) `useReactTable` (TanStack Table)

- You pass **`columns`** and **`data`** (rows).
- `manualPagination: true` tells the table: “I fetch pages from the server; don’t slice data client-side.”
- `pageCount` comes from `totalCount` and `pageSize`.
- `onPaginationChange: setPagination` connects table pagination state to React state.

**Why both Query and Table?**

- Query answers: **how do we load async data reliably?**
- Table answers: **how do we define columns and render rows consistently?**

#### d) JSX rendering

- Header + toolbar (page size select, refresh).
- Conditional UI:
  - loading message
  - error message
- `<table>` rendering using `flexRender` for headers/cells (Table’s recommended approach).

**React idea:** JSX is syntax sugar for `React.createElement`. Conditions like `{error && ...}` render nothing when falsy.

---

### 9) `src/components/CharactersGrid.css`

**Role:** Scoped styling for the grid layout and table readability.

**Why separate CSS file:**

- Keeps `CharactersGrid.tsx` shorter.
- Makes style changes easy to find.

---

## Part F — Mini React curriculum (the ideas you are already using)

### 1) Component

A function that returns UI. Capitalized name (`App`, `CharactersGrid`).

### 2) JSX

HTML-like syntax inside TypeScript. Some attributes differ (`className` instead of `class`).

### 3) Props (not heavily used yet)

Inputs to a component: `<MyButton label="Save" />`. We can add props later to reuse `CharactersGrid` or split it.

### 4) State

Values that change over time (`useState`). Changing state triggers re-render.

### 5) Effects (`useEffect`) — not required for this grid

You *could* fetch in `useEffect`, but TanStack Query replaces most of that pattern for server data.

### 6) Keys in lists

When rendering rows, stable `key` helps React reconcile efficiently. TanStack Table generates row/cell keys internally in many cases; when you map yourself, always key by id.

---

## Part G — How this connects to your API

**Browser (React)** calls:

`GET {VITE_API_BASE_URL}/api/characters?page=1&pageSize=20`

**ASP.NET** returns JSON (camelCase by default) like:

- `items`: array of character rows
- `totalCount`: number for paging UI

**CORS** must allow the Vite origin (`Program.cs` already includes localhost:5173 for dev).

---

## Part H — Common beginner mistakes (checklist)

- API not running → fetch fails → error UI. Start `BattleArena.Api` first.
- Wrong port in `.env.development` → wrong host → network error.
- Mixed content (https page calling http API) → browser blocks; keep both http in dev or both https consistently.
- Forgetting to `npm install` after clone → missing modules.

---

## Part I — Suggested “next learning steps” in this codebase

1. Add a **create form** that POSTs JSON and then `refetch()` the query cache.
2. Split `CharactersGrid` into smaller components (`Toolbar`, `Pager`, `ErrorBanner`).
3. Add **React Router** when you have multiple pages.
4. Add **column sorting** (server-side or client-side) using TanStack Table APIs.

---

## Quick Q&A

**Q: Is React a language?**  
A: No. It is a UI library. You write **JavaScript/TypeScript** with JSX.

**Q: Why not put fetch directly inside a button `onClick`?**  
A: You can for tiny demos, but grids need caching, loading states, and refetch coordination—Query handles that cleanly.

**Q: Why TanStack Table instead of a big HTML `<table>` manual map?**  
A: You still render `<table>`, but Table gives you a scalable model for columns, future sorting/filtering, and consistent cell rendering.

---

If you want this moved into `BattleArena.Api/ProjectQandA.md` as a linked section, say so; keeping it under `web/` keeps frontend docs next to the frontend code.
