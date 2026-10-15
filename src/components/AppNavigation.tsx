import { NavLink } from 'react-router'

export interface NavigationItem {
  path: string
  label: string
}

interface AppNavigationProps {
  items: NavigationItem[]
  onNavigate?: () => void
}

export default function AppNavigation({ items, onNavigate }: AppNavigationProps) {
  return (
    <nav aria-label="Navegación principal">
      <p className="mb-3 px-3 text-xs font-semibold tracking-wider text-mesa-muted">NAVEGACIÓN</p>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              end
              onClick={onNavigate}
              className={({ isActive }) =>
                `mesa-focus flex min-h-11 items-center rounded-lg border-l-2 px-3 py-2.5 text-sm leading-5 wrap-anywhere motion-safe:transition-colors ${
                  isActive
                    ? 'border-mesa-primary bg-mesa-selection font-semibold text-mesa-primary'
                    : 'border-transparent font-medium text-mesa-muted hover:bg-mesa-canvas hover:text-mesa-text'
                }`
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
