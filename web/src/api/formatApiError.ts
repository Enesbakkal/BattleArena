// Turns ASP.NET ValidationProblemDetails JSON into short, readable lines for the UI.

const fieldLabels: Record<string, string> = {
  Name: 'Name',
  Universe: 'Universe',
  Biography: 'Biography',
  Rarity: 'Rarity (must be 1–5)',
  BaseAttack: 'ATK',
  BaseDefense: 'DEF',
  BaseSpeed: 'SPD',
  ImageUrl: 'Image URL',
}

function labelForApiKey(key: string): string {
  const k = key.replace(/^\$/, '')
  const spaced = k.replace(/([A-Z])/g, ' $1').replace(/^\s+/, '')
  return fieldLabels[k] ?? (spaced || key)
}

type ProblemJson = {
  title?: string
  detail?: string
  errors?: Record<string, string[] | string>
}

/** Prefer friendly multi-line text; fall back to raw body or status. */
export function formatApiErrorBody(status: number, bodyText: string): string {
  const raw = bodyText.trim()
  if (!raw) {
    return `Something went wrong (${status}).`
  }
  if (!raw.startsWith('{')) {
    return raw
  }
  try {
    const j = JSON.parse(raw) as ProblemJson
    if (j.errors && typeof j.errors === 'object') {
      const lines: string[] = []
      for (const [key, val] of Object.entries(j.errors)) {
        const label = labelForApiKey(key)
        const msgs = Array.isArray(val) ? val : [String(val)]
        for (const m of msgs) {
          lines.push(`${label}: ${stripFluentPropertyPrefix(m)}`)
        }
      }
      if (lines.length > 0) {
        return lines.join('\n')
      }
    }
    if (j.detail && j.detail.trim()) {
      return j.detail.trim()
    }
    if (j.title && !/one or more validation errors occurred/i.test(j.title)) {
      return j.title
    }
    return 'Please fix the highlighted fields and try again.'
  } catch {
    return raw
  }
}

/** Removes leading `'PropertyName'` from FluentValidation messages (we already show a label). */
function stripFluentPropertyPrefix(msg: string): string {
  return msg.replace(/^'[^']+'\s+/, '').trim()
}
