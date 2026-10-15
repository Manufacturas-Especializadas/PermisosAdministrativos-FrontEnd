import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import LoadingState from './LoadingState'

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
      <main className="grid min-h-dvh place-items-center bg-mesa-canvas px-4 text-mesa-muted">
        <LoadingState compact>Cargando...</LoadingState>
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
