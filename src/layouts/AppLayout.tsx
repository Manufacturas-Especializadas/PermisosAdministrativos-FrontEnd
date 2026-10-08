import { useCallback, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'
import BrandLogo from '../components/BrandLogo'
import AppNavigation from '../components/AppNavigation'
import MobileNavigation from '../components/MobileNavigation'
import { useAuth } from '../auth/AuthContext'
import { hasAllowedRole, protectedFeatures } from '../auth/roleAccess'

interface AppLayoutProps {
  children: ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [error, setError] = useState('')
  const navigationItems = [
    { path: '/', label: 'Inicio' },
    ...protectedFeatures.filter((feature) =>
      hasAllowedRole(user?.roles ?? [], feature.allowedRoles),
    ),
  ]

  async function handleLogout() {
    if (isLoggingOut) return

    setIsLoggingOut(true)
    setError('')

    try {
      await logout()
      navigate('/login', { replace: true })
    } catch {
      setError('No se pudo cerrar sesión. Inténtalo de nuevo.')
    } finally {
      setIsLoggingOut(false)
    }
  }

  const currentSection = navigationItems.find((item) => item.path === location.pathname)?.label ?? 'Permisos Administrativos'
  const userActions = (
    <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center">
      <div className="min-w-0 md:max-w-52">
        <p className="text-xs font-medium text-mesa-muted">Usuario</p>
        <p className="text-sm font-medium wrap-anywhere">{user?.userName}</p>
      </div>
      <button type="button" className="mesa-button-secondary shrink-0" onClick={handleLogout} disabled={isLoggingOut}>
        {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
      </button>
    </div>
  )

  return (
    <div className="min-h-dvh bg-mesa-canvas text-mesa-text xl:grid xl:grid-cols-[15rem_minmax(0,1fr)]">
      <a href="#main-content" className="mesa-focus sr-only z-20 rounded-lg bg-mesa-primary px-4 py-3 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Ir al contenido principal
      </a>
      <aside className="sticky top-0 hidden h-dvh min-w-0 flex-col overflow-y-auto border-r border-mesa-border bg-white px-4 py-6 xl:flex" aria-label="Navegación de escritorio">
        <div className="mb-6 space-y-3 px-3">
          <BrandLogo size="sidebar" />
          <p className="text-lg leading-snug font-semibold">Permisos Administrativos</p>
          <div className="h-1 w-10 rounded-full bg-mesa-brand" aria-hidden="true" />
        </div>
        <AppNavigation items={navigationItems} />
      </aside>
      <div className="min-w-0">
        <header className="border-b border-mesa-border bg-white px-4 py-3 md:px-6 xl:px-8">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="mesa-button-secondary shrink-0 xl:hidden"
                aria-expanded={menuOpen}
                aria-controls="mobile-navigation"
                aria-haspopup="dialog"
                onClick={() => setMenuOpen(true)}
              >
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
                Menú
              </button>
              <div className="xl:hidden"><BrandLogo /></div>
              <p className="hidden text-lg font-semibold wrap-anywhere lg:block">Permisos Administrativos</p>
            </div>
            <div className="hidden min-w-0 md:block">{userActions}</div>
            <button type="button" className="mesa-button-secondary shrink-0 md:hidden" onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? 'Cerrando...' : 'Salir'}
            </button>
          </div>
          <p className="mt-3 text-sm font-medium wrap-anywhere text-mesa-muted" aria-label="Sección actual">{currentSection}</p>
        </header>
        <main id="main-content" tabIndex={-1} className="mesa-focus min-w-0 px-4 py-6 text-slate-900 md:px-6 md:py-8 xl:px-8">
          {error && !menuOpen && <p className="mesa-alert-error mb-6" role="alert">{error}</p>}
          {children}
        </main>
      </div>
      <MobileNavigation open={menuOpen} onClose={closeMenu} items={navigationItems}>
        {error && menuOpen && <p className="mesa-alert-error mb-3" role="alert">{error}</p>}
        {userActions}
      </MobileNavigation>
    </div>
  )
}
