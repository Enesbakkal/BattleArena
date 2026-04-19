import { useCallback, useEffect, useId, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { EnvironmentBadge } from './EnvironmentBadge'
import './AppLayout.css'

const desktopMq = '(min-width: 960px)'

export function AppLayout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const navId = useId()

  const closeSidebar = useCallback(() => setSidebarOpen(false), [])
  const toggleSidebar = useCallback(() => setSidebarOpen((o) => !o), [])

  useEffect(() => {
    const mq = window.matchMedia(desktopMq)
    const sync = () => {
      setIsDesktop(mq.matches)
      if (mq.matches) setSidebarOpen(false)
    }
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    closeSidebar()
  }, [location.pathname, closeSidebar])

  useEffect(() => {
    if (!sidebarOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSidebar()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sidebarOpen, closeSidebar])

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <button
          type="button"
          className="app-shell__menu-btn"
          aria-label="Open navigation menu"
          aria-expanded={sidebarOpen}
          aria-controls={navId}
          onClick={toggleSidebar}
        >
          <span className="app-shell__menu-icon" aria-hidden />
        </button>
        <div className="app-shell__brand">
          <NavLink to="/characters" className="app-shell__brand-link" onClick={closeSidebar}>
            <span className="app-shell__brand-title">Battle Arena</span>
            <span className="app-shell__brand-sub">Figures &amp; catalog</span>
          </NavLink>
        </div>
        <span className="app-shell__header-spacer" aria-hidden />
        <EnvironmentBadge />
      </header>

      {sidebarOpen ? (
        <button
          type="button"
          className="app-shell__scrim"
          aria-label="Close menu"
          onClick={closeSidebar}
        />
      ) : null}

      <aside
        id={navId}
        className={`app-shell__sidebar${sidebarOpen ? ' app-shell__sidebar--open' : ''}`}
        aria-hidden={!isDesktop && !sidebarOpen}
      >
        <nav className="app-shell__nav" aria-label="Main">
          <NavLink
            to="/characters"
            end
            className={({ isActive }) =>
              `app-shell__nav-link${isActive ? ' app-shell__nav-link--active' : ''}`
            }
          >
            Characters
          </NavLink>
          <span className="app-shell__nav-placeholder">More sections later…</span>
        </nav>
      </aside>

      <main className="app-shell__main">
        <Outlet />
      </main>

      <footer className="app-shell__footer">
        <p>
          Battle Arena
          {import.meta.env.DEV ? ' — local development' : ''}. API:{' '}
          <code className="app-shell__footer-code">{import.meta.env.VITE_API_BASE_URL ?? '—'}</code>
        </p>
      </footer>
    </div>
  )
}
