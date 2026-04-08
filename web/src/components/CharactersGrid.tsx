import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type PaginationState,
} from '@tanstack/react-table'
import { createCharacter, fetchCharactersPage } from '../api/charactersApi'
import type { CharacterRow } from '../types/characters'
import './CharactersGrid.css'

const columnHelper = createColumnHelper<CharacterRow>()

// TanStack Table column definitions; accessors match API camelCase JSON.
const columns = [
  columnHelper.accessor('name', { header: 'Name', cell: (info) => info.getValue() }),
  columnHelper.accessor('universe', { header: 'Universe', cell: (info) => info.getValue() }),
  columnHelper.accessor('rarity', { header: 'Rarity', cell: (info) => info.getValue() }),
  columnHelper.accessor('baseAttack', { header: 'ATK', cell: (info) => info.getValue() }),
  columnHelper.accessor('baseDefense', { header: 'DEF', cell: (info) => info.getValue() }),
  columnHelper.accessor('baseSpeed', { header: 'SPD', cell: (info) => info.getValue() }),
  columnHelper.accessor('createdAtUtc', {
    header: 'Created (UTC)',
    cell: (info) => new Date(info.getValue()).toLocaleString(),
  }),
]

export function CharactersGrid() {
  const queryClient = useQueryClient()

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  })

  const [name, setName] = useState('Monkey D. Luffy')
  const [universe, setUniverse] = useState('One Piece')
  const [rarity, setRarity] = useState(5)
  const [baseAttack, setBaseAttack] = useState(120)
  const [baseDefense, setBaseDefense] = useState(90)
  const [baseSpeed, setBaseSpeed] = useState(110)

  const page = pagination.pageIndex + 1
  const { pageSize } = pagination

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['characters', page, pageSize],
    queryFn: ({ signal }) => fetchCharactersPage(page, pageSize, signal),
    placeholderData: (prev) => prev,
  })

  const createMutation = useMutation({
    mutationFn: () =>
      createCharacter({
        name: name.trim(),
        universe: universe.trim(),
        biography: null,
        rarity,
        baseAttack,
        baseDefense,
        baseSpeed,
        imageUrl: null,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['characters'] })
    },
  })

  const totalPages = useMemo(() => {
    if (!data) return 1
    return Math.max(1, Math.ceil(data.totalCount / pageSize))
  }, [data, pageSize])

  const table = useReactTable({
    data: data?.items ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
    onPaginationChange: setPagination,
    state: {
      pagination,
    },
  })

  return (
    <div className="characters-grid">
      <header className="characters-grid__header">
        <h1>Characters</h1>
        <p className="characters-grid__hint">
          API: <code>{import.meta.env.VITE_API_BASE_URL}</code> — start BattleArena.Api first.
        </p>
        <section className="characters-grid__form" aria-label="Add character">
          <h2 className="characters-grid__form-title">Add character</h2>
          <div className="characters-grid__form-grid">
            <label className="characters-grid__field">
              Name
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="characters-grid__field">
              Universe
              <input value={universe} onChange={(e) => setUniverse(e.target.value)} />
            </label>
            <label className="characters-grid__field">
              Rarity (1–5)
              <input
                type="number"
                min={1}
                max={5}
                value={rarity}
                onChange={(e) => setRarity(Number(e.target.value))}
              />
            </label>
            <label className="characters-grid__field">
              ATK
              <input
                type="number"
                min={0}
                value={baseAttack}
                onChange={(e) => setBaseAttack(Number(e.target.value))}
              />
            </label>
            <label className="characters-grid__field">
              DEF
              <input
                type="number"
                min={0}
                value={baseDefense}
                onChange={(e) => setBaseDefense(Number(e.target.value))}
              />
            </label>
            <label className="characters-grid__field">
              SPD
              <input
                type="number"
                min={0}
                value={baseSpeed}
                onChange={(e) => setBaseSpeed(Number(e.target.value))}
              />
            </label>
          </div>
          {createMutation.isError && (
            <p className="characters-grid__error" role="alert">
              {(createMutation.error as Error).message}
            </p>
          )}
          {createMutation.isSuccess && (
            <p className="characters-grid__status">Saved (id: {createMutation.data}). Grid refreshed.</p>
          )}
          <button
            type="button"
            className="characters-grid__submit"
            disabled={createMutation.isPending || !name.trim() || !universe.trim()}
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? 'Saving…' : 'Save character'}
          </button>
        </section>

        <div className="characters-grid__toolbar">
          <label>
            Page size{' '}
            <select
              value={pageSize}
              onChange={(e) => {
                const next = Number(e.target.value)
                setPagination({ pageIndex: 0, pageSize: next })
              }}
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={() => void refetch()} disabled={isFetching}>
            Refresh
          </button>
        </div>
      </header>

      {isLoading && <p className="characters-grid__status">Loading…</p>}
      {error && (
        <p className="characters-grid__error" role="alert">
          {(error as Error).message}
        </p>
      )}

      <div className="characters-grid__table-wrap">
        <table className="characters-grid__table">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 && !isLoading ? (
              <tr>
                <td colSpan={columns.length} className="characters-grid__empty">
                  No rows yet. POST a character from the API or use BattleArena.Api.http.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <footer className="characters-grid__pager">
        <button
          type="button"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage() || isFetching}
        >
          Previous
        </button>
        <span>
          Page {page} / {totalPages}
          {data ? ` · ${data.totalCount} total` : ''}
        </span>
        <button
          type="button"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage() || isFetching}
        >
          Next
        </button>
      </footer>
    </div>
  )
}
