import type { CreateCharacterBody } from '../api/charactersApi'
import type { CharacterDetail } from '../types/characters'

export type CharacterFormValues = {
  name: string
  universe: string
  biography: string
  rarity: number
  baseAttack: number
  baseDefense: number
  baseSpeed: number
  imageUrl: string
}

export function emptyCharacterForm(): CharacterFormValues {
  return {
    name: '',
    universe: '',
    biography: '',
    rarity: 3,
    baseAttack: 0,
    baseDefense: 0,
    baseSpeed: 0,
    imageUrl: '',
  }
}

export function detailToForm(d: CharacterDetail): CharacterFormValues {
  return {
    name: d.name,
    universe: d.universe,
    biography: d.biography ?? '',
    rarity: d.rarity,
    baseAttack: d.baseAttack,
    baseDefense: d.baseDefense,
    baseSpeed: d.baseSpeed,
    imageUrl: d.imageUrl ?? '',
  }
}

export function valuesToBody(v: CharacterFormValues): CreateCharacterBody {
  return {
    name: v.name.trim(),
    universe: v.universe.trim(),
    biography: v.biography.trim() || null,
    rarity: v.rarity,
    baseAttack: v.baseAttack,
    baseDefense: v.baseDefense,
    baseSpeed: v.baseSpeed,
    imageUrl: v.imageUrl.trim() || null,
  }
}

type Props = {
  values: CharacterFormValues
  onChange: (next: CharacterFormValues) => void
  disabled?: boolean
}

export function CharacterFormFields({ values, onChange, disabled }: Props) {
  const set = (patch: Partial<CharacterFormValues>) => onChange({ ...values, ...patch })

  return (
    <div className="characters-grid__form-grid">
      <label className="characters-grid__field">
        Name
        <input value={values.name} onChange={(e) => set({ name: e.target.value })} disabled={disabled} />
      </label>
      <label className="characters-grid__field">
        Universe
        <input value={values.universe} onChange={(e) => set({ universe: e.target.value })} disabled={disabled} />
      </label>
      <label className="characters-grid__field">
        Biography
        <input value={values.biography} onChange={(e) => set({ biography: e.target.value })} disabled={disabled} />
      </label>
      <label className="characters-grid__field">
        Image URL
        <input value={values.imageUrl} onChange={(e) => set({ imageUrl: e.target.value })} disabled={disabled} />
      </label>
      <label className="characters-grid__field">
        Rarity (1–5)
        <input
          type="number"
          min={1}
          max={5}
          value={values.rarity}
          onChange={(e) => set({ rarity: Number(e.target.value) })}
          disabled={disabled}
        />
      </label>
      <label className="characters-grid__field">
        ATK
        <input
          type="number"
          min={0}
          value={values.baseAttack}
          onChange={(e) => set({ baseAttack: Number(e.target.value) })}
          disabled={disabled}
        />
      </label>
      <label className="characters-grid__field">
        DEF
        <input
          type="number"
          min={0}
          value={values.baseDefense}
          onChange={(e) => set({ baseDefense: Number(e.target.value) })}
          disabled={disabled}
        />
      </label>
      <label className="characters-grid__field">
        SPD
        <input
          type="number"
          min={0}
          value={values.baseSpeed}
          onChange={(e) => set({ baseSpeed: Number(e.target.value) })}
          disabled={disabled}
        />
      </label>
    </div>
  )
}
