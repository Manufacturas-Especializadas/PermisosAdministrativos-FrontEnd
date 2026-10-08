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
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              end
              onClick={onNavigate}
              className={({ isActive }) =>
                `mesa-focus flex min-h-12 items-center rounded-r-lg border-l-4 px-3 py-3 text-sm wrap-anywhere motion-safe:transition-colors ${
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
