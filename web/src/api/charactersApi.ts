import type { CharacterDetail, PagedCharacterRowsResult } from '../types/characters'
import { formatApiErrorBody } from './formatApiError'

// Base URL from Vite env; trim trailing slash so paths stay correct.
function apiBase(): string {
  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined
  return (raw ?? '').replace(/\/$/, '')
}

// Server-side paged GET for the grid (BattleArena.Api CharactersController).
export async function fetchCharactersPage(
  page: number,
  pageSize: number,
  signal?: AbortSignal,
): Promise<PagedCharacterRowsResult> {
  const url = new URL(`${apiBase()}/api/characters`)
  url.searchParams.set('page', String(page))
  url.searchParams.set('pageSize', String(pageSize))

  const res = await fetch(url.toString(), { signal })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(formatApiErrorBody(res.status, text))
  }
  return (await res.json()) as PagedCharacterRowsResult
}

export type CreateCharacterBody = {
  name: string
  universe: string
  biography?: string | null
  rarity: number
  baseAttack: number
  baseDefense: number
  baseSpeed: number
  imageUrl?: string | null
}

// POST /api/characters — returns new character id (JSON string GUID).
export async function createCharacter(
  body: CreateCharacterBody,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch(`${apiBase()}/api/characters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })

  const text = await res.text()
  if (!res.ok) {
    throw new Error(formatApiErrorBody(res.status, text))
  }

  try {
    return JSON.parse(text) as string
  } catch {
    return text.replace(/^"|"$/g, '')
  }
}

export async function fetchCharacterById(
  id: string,
  signal?: AbortSignal,
): Promise<CharacterDetail> {
  const res = await fetch(`${apiBase()}/api/characters/${encodeURIComponent(id)}`, { signal })
  if (res.status === 404) {
    throw new Error('Character not found.')
  }
  if (!res.ok) {
    const text = await res.text()
    throw new Error(formatApiErrorBody(res.status, text))
  }
  return (await res.json()) as CharacterDetail
}

export async function updateCharacter(
  id: string,
  body: CreateCharacterBody,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`${apiBase()}/api/characters/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })
  if (res.status === 404) {
    throw new Error('Character not found.')
  }
  if (!res.ok) {
    const text = await res.text()
    throw new Error(formatApiErrorBody(res.status, text))
  }
}

export async function deleteCharacter(id: string, signal?: AbortSignal): Promise<void> {
  const res = await fetch(`${apiBase()}/api/characters/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    signal,
  })
  if (res.status === 404) {
    throw new Error('Character not found.')
  }
  if (!res.ok) {
    const text = await res.text()
    throw new Error(formatApiErrorBody(res.status, text))
  }
}
