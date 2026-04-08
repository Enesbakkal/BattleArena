import type { PagedCharacterRowsResult } from '../types/characters'

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
    throw new Error(text || `Request failed: ${res.status}`)
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
    throw new Error(text || `Request failed: ${res.status}`)
  }

  try {
    return JSON.parse(text) as string
  } catch {
    return text.replace(/^"|"$/g, '')
  }
}
