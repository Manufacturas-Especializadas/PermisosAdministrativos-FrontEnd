import type { ReactNode } from 'react'
import { Link, Navigate } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { hasAllowedRole } from '../auth/roleAccess'
import LoadingState from './LoadingState'

interface RoleRouteProps {
  allowedRoles: string[]
  children: ReactNode
}

export default function RoleRoute({ allowedRoles, children }: RoleRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth()

  if (isLoading) {
    return <LoadingState compact>Cargando...</LoadingState>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!hasAllowedRole(user?.roles ?? [], allowedRoles)) {
    return (
      <section className="mesa-card" aria-labelledby="unauthorized-title">
        <h1 id="unauthorized-title" className="mesa-page-title">
          Acceso no autorizado
        </h1>
        <p className="mt-3 text-sm text-slate-600">Tu cuenta no tiene acceso a esta área.</p>
        <Link
          className="mesa-button-primary mt-6"
          to="/"
        >
          Regresar al inicio
        </Link>
      </section>
    )
  }

  return children
}
