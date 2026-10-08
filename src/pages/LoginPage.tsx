import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import BrandLogo from '../components/BrandLogo'

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
      <main className="grid min-h-dvh place-items-center bg-mesa-canvas px-4 text-mesa-muted">
        <p role="status">Cargando...</p>
      </main>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <main className="flex min-h-dvh flex-col bg-mesa-canvas px-4 py-4 text-mesa-text sm:px-6 sm:py-6">
      <section
        className="m-auto w-full max-w-md rounded-2xl border border-mesa-border bg-white p-5 shadow-sm sm:p-8 xl:p-10"
        aria-labelledby="login-title"
      >
        <div className="mb-6 space-y-3">
          <BrandLogo size="login" />
          <h1 id="login-title" className="text-2xl font-semibold tracking-tight text-mesa-text">
            Permisos Administrativos
          </h1>
          <p className="text-sm leading-6 text-mesa-muted">
            Ingresa con tu cuenta para acceder al sistema.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
          <div>
            <label className="mb-2 block text-sm font-medium" htmlFor="userName">Usuario</label>
            <input
              className="mesa-input"
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
              className="mesa-input"
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
            <p id="login-error" className="mesa-alert-error" role="alert">
              {error}
            </p>
          )}
          <button
            className="mesa-button-primary w-full"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
          {isSubmitting && <p className="text-center text-sm text-mesa-muted" role="status">Cargando...</p>}
        </form>
      </section>
    </main>
  )
}
