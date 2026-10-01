import { useAuth } from '../auth/AuthContext'

export default function HomePage() {
  const { user } = useAuth()

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
      </section>
    </div>
  )
}
