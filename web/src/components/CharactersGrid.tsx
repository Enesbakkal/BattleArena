import { useLayoutEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type PaginationState,
} from '@tanstack/react-table'
import {
  createCharacter,
  deleteCharacter,
  fetchCharacterById,
  fetchCharactersPage,
  updateCharacter,
} from '../api/charactersApi'
import type { CharacterRow } from '../types/characters'
import {
  CharacterFormFields,
  detailToForm,
  emptyCharacterForm,
  valuesToBody,
  type CharacterFormValues,
} from './CharacterFormFields'
import { Modal } from './Modal'
import './CharactersGrid.css'

const columnHelper = createColumnHelper<CharacterRow>()

type ModalState =
  | { kind: 'none' }
  | { kind: 'create' }
  | { kind: 'read'; id: string }
  | { kind: 'edit'; id: string }
  | { kind: 'delete'; row: CharacterRow }

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
  const [modal, setModal] = useState<ModalState>({ kind: 'none' })
  const [form, setForm] = useState<CharacterFormValues>(() => emptyCharacterForm())

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

  const detailId = modal.kind === 'read' || modal.kind === 'edit' ? modal.id : null

  const detailQuery = useQuery({
    queryKey: ['character', detailId ?? ''],
    queryFn: ({ signal }) => fetchCharacterById(detailId!, signal),
    enabled: detailId != null,
  })

  useLayoutEffect(() => {
    if (modal.kind !== 'edit') return
    const d = detailQuery.data
    if (!d || d.id !== modal.id) return
    setForm(detailToForm(d))
  }, [modal, detailQuery.data])

  const closeModal = () => setModal({ kind: 'none' })

  const openCreate = () => {
    setForm(emptyCharacterForm())
    setModal({ kind: 'create' })
  }

  const createMutation = useMutation({
    mutationFn: () => createCharacter(valuesToBody(form)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['characters'] })
      closeModal()
    },
  })

  const updateMutation = useMutation({
    mutationFn: () => {
      if (modal.kind !== 'edit') throw new Error('No character selected.')
      return updateCharacter(modal.id, valuesToBody(form))
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['characters'] })
      if (modal.kind === 'edit') {
        await queryClient.invalidateQueries({ queryKey: ['character', modal.id] })
      }
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (modal.kind !== 'delete') throw new Error('No character selected.')
      return deleteCharacter(modal.row.id)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['characters'] })
      closeModal()
    },
  })

  const tableColumns = useMemo(
    () => [
      ...columns,
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="characters-grid__actions">
            <button type="button" onClick={() => setModal({ kind: 'read', id: row.original.id })}>
              View
            </button>
            <button type="button" onClick={() => setModal({ kind: 'edit', id: row.original.id })}>
              Edit
            </button>
            <button type="button" onClick={() => setModal({ kind: 'delete', row: row.original })}>
              Delete
            </button>
          </div>
        ),
      }),
    ],
    [],
  )

  const totalPages = useMemo(() => {
    if (!data) return 1
    return Math.max(1, Math.ceil(data.totalCount / pageSize))
  }, [data, pageSize])

  const table = useReactTable({
    data: data?.items ?? [],
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
    onPaginationChange: setPagination,
    state: {
      pagination,
    },
  })

  const canSaveCreate =
    form.name.trim().length > 0 && form.universe.trim().length > 0 && !createMutation.isPending

  const canSaveEdit =
    form.name.trim().length > 0 && form.universe.trim().length > 0 && !updateMutation.isPending

  const readDetail = modal.kind === 'read' ? detailQuery.data : null
  const readLoading = modal.kind === 'read' && detailQuery.isLoading
  const readError = modal.kind === 'read' && detailQuery.isError

  return (
    <div className="characters-grid">
      <header className="characters-grid__header">
        <h1>Characters</h1>
        <p className="characters-grid__hint">
          API: <code>{import.meta.env.VITE_API_BASE_URL}</code> — start BattleArena.Api first.
        </p>
        <div className="characters-grid__toolbar">
          <button type="button" className="characters-grid__add" onClick={openCreate}>
            Add character
          </button>
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
                <td colSpan={tableColumns.length} className="characters-grid__empty">
                  No rows yet. Use Add character or POST /api/characters.
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

      <Modal
        open={modal.kind === 'create'}
        title="Create character"
        onClose={closeModal}
        footer={
          <>
            <button type="button" className="btn btn--secondary" onClick={closeModal}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn--primary"
              disabled={!canSaveCreate}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        {createMutation.isError && (
          <p className="characters-grid__error" role="alert">
            {(createMutation.error as Error).message}
          </p>
        )}
        <CharacterFormFields values={form} onChange={setForm} />
      </Modal>

      <Modal
        open={modal.kind === 'read'}
        title="Character details"
        onClose={closeModal}
        footer={
          <button type="button" className="btn btn--secondary" onClick={closeModal}>
            Close
          </button>
        }
      >
        {readLoading && <p className="characters-grid__status">Loading…</p>}
        {readError && (
          <p className="characters-grid__error" role="alert">
            {(detailQuery.error as Error).message}
          </p>
        )}
        {readDetail && (
          <dl className="characters-grid__read">
            <dt>Name</dt>
            <dd>{readDetail.name}</dd>
            <dt>Universe</dt>
            <dd>{readDetail.universe}</dd>
            <dt>Biography</dt>
            <dd>{readDetail.biography ?? '—'}</dd>
            <dt>Image URL</dt>
            <dd>{readDetail.imageUrl ?? '—'}</dd>
            <dt>Rarity</dt>
            <dd>{readDetail.rarity}</dd>
            <dt>ATK / DEF / SPD</dt>
            <dd>
              {readDetail.baseAttack} / {readDetail.baseDefense} / {readDetail.baseSpeed}
            </dd>
            <dt>Created (UTC)</dt>
            <dd>{new Date(readDetail.createdAtUtc).toLocaleString()}</dd>
          </dl>
        )}
      </Modal>

      <Modal
        open={modal.kind === 'edit'}
        title="Edit character"
        onClose={closeModal}
        footer={
          <>
            <button type="button" className="btn btn--secondary" onClick={closeModal}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn--primary"
              disabled={!canSaveEdit || detailQuery.isLoading}
              onClick={() => updateMutation.mutate()}
            >
              {updateMutation.isPending ? 'Saving…' : 'Save changes'}
            </button>
          </>
        }
      >
        {detailQuery.isLoading && <p className="characters-grid__status">Loading…</p>}
        {detailQuery.isError && (
          <p className="characters-grid__error" role="alert">
            {(detailQuery.error as Error).message}
          </p>
        )}
        {modal.kind === 'edit' && detailQuery.data?.id === modal.id && (
          <>
            {updateMutation.isError && (
              <p className="characters-grid__error" role="alert">
                {(updateMutation.error as Error).message}
              </p>
            )}
            <CharacterFormFields values={form} onChange={setForm} />
          </>
        )}
      </Modal>

      <Modal
        open={modal.kind === 'delete'}
        title="Delete character"
        onClose={closeModal}
        footer={
          <>
            <button type="button" className="btn btn--secondary" onClick={closeModal}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn--danger"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </button>
          </>
        }
      >
        {modal.kind === 'delete' && (
          <p>
            Delete <strong>{modal.row.name}</strong> ({modal.row.universe})? This cannot be undone.
          </p>
        )}
        {deleteMutation.isError && (
          <p className="characters-grid__error" role="alert">
            {(deleteMutation.error as Error).message}
          </p>
        )}
      </Modal>
    </div>
  )
}
