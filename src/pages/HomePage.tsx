import { Link } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { hasAllowedRole, protectedAreas } from '../auth/roleAccess'

export default function HomePage() {
  const { user } = useAuth()
  const accessibleAreas = protectedAreas.filter((area) =>
    hasAllowedRole(user?.roles ?? [], area.allowedRoles),
  )

  return (
    <div className="space-y-8">
      <section aria-labelledby="welcome-title">
        <h1 id="welcome-title" className="text-3xl font-semibold tracking-tight text-slate-950">Bienvenido</h1>
        <dl className="mt-5 space-y-4">
          <div>
            <dt className="text-sm font-medium text-slate-600">Usuario</dt>
            <dd className="mt-1 wrap-anywhere text-lg font-medium">{user?.userName}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-600">Roles</dt>
            <dd className="mt-2">
              {user && user.roles.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {user.roles.map((role) => (
                    <li key={role} className="max-w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm font-medium wrap-anywhere text-slate-700">
                      {role}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-sm text-slate-600">Sin roles asignados</span>
              )}
            </dd>
          </div>
        </dl>
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="panel-title">
        <h2 id="panel-title" className="text-lg font-semibold text-slate-950">Panel principal</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Próximamente encontrarás aquí las opciones del sistema.</p>
        {accessibleAreas.length > 0 && (
          <nav className="mt-5" aria-label="Áreas disponibles">
            <ul className="flex flex-wrap gap-3">
              {accessibleAreas.map((area) => (
                <li key={area.path}>
                  <Link
                    className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition-colors hover:border-blue-700 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                    to={area.path}
                  >
                    {area.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </section>
    </div>
  )
}
