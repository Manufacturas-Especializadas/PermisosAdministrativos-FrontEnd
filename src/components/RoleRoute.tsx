import type { ReactNode } from 'react'
import { Link, Navigate } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { hasAllowedRole } from '../auth/roleAccess'

interface RoleRouteProps {
  allowedRoles: string[]
  children: ReactNode
}

export default function RoleRoute({ allowedRoles, children }: RoleRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth()

  if (isLoading) {
    return <p role="status" className="text-slate-600">Cargando...</p>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!hasAllowedRole(user?.roles ?? [], allowedRoles)) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="unauthorized-title">
        <h1 id="unauthorized-title" className="text-2xl font-semibold tracking-tight text-slate-950">
          Acceso no autorizado
        </h1>
        <p className="mt-3 text-sm text-slate-600">Tu cuenta no tiene acceso a esta área.</p>
        <Link
          className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          to="/"
        >
          Regresar al inicio
        </Link>
      </section>
    )
  }

  return children
}
