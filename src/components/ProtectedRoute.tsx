import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from '../auth/AuthContext'

interface ProtectedRouteProps {
  children: ReactNode
  allowPasswordChange?: boolean
}

export default function ProtectedRoute({
  children,
  allowPasswordChange = false,
}: ProtectedRouteProps) {
  const { isLoading, isAuthenticated, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <main className="grid min-h-dvh place-items-center bg-slate-50 px-4 text-slate-600">
        <p role="status">Cargando...</p>
      </main>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (
    user?.mustChangePassword &&
    !allowPasswordChange
  ) {
    return <Navigate to="/change-password" replace state={{ from: location.pathname }} />
  }

  return children
}
