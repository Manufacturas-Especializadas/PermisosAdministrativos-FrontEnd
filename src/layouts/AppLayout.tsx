import { useState, type ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { hasAllowedRole, protectedFeatures } from '../auth/roleAccess'

interface AppLayoutProps {
  children: ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
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

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 text-slate-900">
      <a
        className="sr-only z-10 rounded-lg bg-blue-700 px-4 py-3 font-medium text-white focus:not-sr-only focus:absolute focus:top-3 focus:left-4 focus:outline-2 focus:outline-offset-2 focus:outline-blue-700"
        href="#main-content"
      >
        Ir al contenido principal
      </a>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-5 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src="/logomesa-1.png"
              alt="Manufacturas Especializadas"
              className="h-10 w-auto max-w-36 shrink-0 object-contain"
            />
            <p className="text-lg font-semibold tracking-tight text-slate-950">
              Permisos Administrativos
            </p>
          </div>
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            <div className="min-w-0 md:text-right">
              <p className="text-xs font-medium text-slate-500">Usuario</p>
              <p className="wrap-anywhere text-sm font-medium">{user?.userName}</p>
            </div>
            <button
              className="min-h-11 shrink-0 cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-wait disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-500"
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
            </button>
          </div>
        </div>
        <nav className="border-t border-slate-100" aria-label="Navegación principal">
          <ul className="mx-auto flex max-w-6xl flex-wrap gap-2 px-4 py-3 sm:px-6 lg:px-8">
            {navigationItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end
                  className={({ isActive }) =>
                    `inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${
                      isActive
                        ? 'bg-blue-50 text-blue-800'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {error && (
          <p className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {error}
          </p>
        )}
        {children}
      </main>
    </div>
  )
}
