import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { useAuth } from '../auth/AuthContext'

export default function LoginPage() {
  const { login, isLoading, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [userName, setUserName] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSubmitting) return

    setError('')

    if (!userName.trim()) {
      setError('El usuario es obligatorio.')
      return
    }

    if (!password) {
      setError('La contraseña es obligatoria.')
      return
    }

    setIsSubmitting(true)

    try {
      await login({ userName: userName.trim(), password })
      navigate('/', { replace: true })
    } catch {
      setError('Usuario o contraseña incorrectos.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <main className="grid min-h-dvh place-items-center bg-slate-50 px-4 text-slate-600">
        <p role="status">Cargando...</p>
      </main>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-slate-50 px-4 py-10 text-slate-900 sm:px-6">
      <section
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10"
        aria-labelledby="login-title"
      >
        <div className="mb-8">
          <div className="mb-6 h-1 w-10 rounded-full bg-blue-700" aria-hidden="true" />
          <h1 id="login-title" className="text-2xl font-semibold tracking-tight text-slate-950">
            Permisos Administrativos
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Ingresa con tu cuenta para acceder al sistema.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
          <div>
            <label className="mb-2 block text-sm font-medium" htmlFor="userName">Usuario</label>
            <input
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 shadow-xs transition-colors hover:border-slate-400 focus-visible:border-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
              id="userName"
              name="userName"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={userName}
              onChange={(event) => setUserName(event.target.value)}
              disabled={isSubmitting}
              aria-describedby={error ? 'login-error' : undefined}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium" htmlFor="password">Contraseña</label>
            <input
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 shadow-xs transition-colors hover:border-slate-400 focus-visible:border-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting}
              aria-describedby={error ? 'login-error' : undefined}
              required
            />
          </div>

          {error && (
            <p id="login-error" className="rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-800" role="alert">
              {error}
            </p>
          )}
          <button
            className="min-h-11 w-full cursor-pointer rounded-lg bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-wait disabled:bg-slate-200 disabled:text-slate-600 disabled:shadow-none"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
          {isSubmitting && <p className="text-center text-sm text-slate-600" role="status">Cargando...</p>}
        </form>
      </section>
    </main>
  )
}
