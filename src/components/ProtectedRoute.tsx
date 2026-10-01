import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { useAuth } from '../auth/AuthContext'

interface ProtectedRouteProps {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoading, isAuthenticated } = useAuth()

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

  return children
}
