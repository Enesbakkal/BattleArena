// Matches ASP.NET JSON camelCase for PagedCharacterRowsResult and CharacterRowDto.

export type CharacterRow = {
  id: string
  name: string
  universe: string
  rarity: number
  baseAttack: number
  baseDefense: number
  baseSpeed: number
  imageUrl: string | null
  createdAtUtc: string
}

export type PagedCharacterRowsResult = {
  items: CharacterRow[]
  totalCount: number
}

// GET /api/characters/{id} — CharacterDetailDto
export type CharacterDetail = {
  id: string
  name: string
  universe: string
  biography: string | null
  rarity: number
  baseAttack: number
  baseDefense: number
  baseSpeed: number
  imageUrl: string | null
  createdAtUtc: string
}
