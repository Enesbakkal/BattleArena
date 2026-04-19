import './EnvironmentBadge.css'

/** Vite: DEV = `vite` dev server; PROD = `vite build` output. */
export function EnvironmentBadge() {
  const prod = import.meta.env.PROD
  const mode = import.meta.env.MODE
  const label = prod ? 'PROD' : 'DEV'
  const title = `Vite MODE=${mode} · PROD=${String(prod)}`

  return (
    <span className={`env-badge env-badge--${prod ? 'prod' : 'dev'}`} title={title}>
      {label}
    </span>
  )
}
