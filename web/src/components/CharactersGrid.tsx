import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type PaginationState,
} from '@tanstack/react-table'
import { fetchCharactersPage } from '../api/charactersApi'
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
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  })

  const page = pagination.pageIndex + 1
  const { pageSize } = pagination

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['characters', page, pageSize],
    queryFn: ({ signal }) => fetchCharactersPage(page, pageSize, signal),
    placeholderData: (prev) => prev,
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
