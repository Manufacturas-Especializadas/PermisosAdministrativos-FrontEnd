import { isAxiosError } from 'axios'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import Alert from '../components/Alert'
import Button from '../components/Button'
import BrandLogo from '../components/BrandLogo'
import { useAuth } from '../auth/AuthContext'

function getChangePasswordError(error: unknown): string {
    if (isAxiosError(error)) {
        const data = error.response?.data

        if (
            data &&
            typeof data === 'object' &&
            'errors' in data &&
            data.errors &&
            typeof data.errors === 'object'
        ) {
            const messages = Object.values(data.errors as Record<string, unknown>)
                .flatMap((value) => Array.isArray(value) ? value : [value])
                .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)

            if (messages.length > 0) {
                return messages.join(' ')
            }
        }

        if (
            data &&
            typeof data === 'object' &&
            'title' in data &&
            typeof data.title === 'string' &&
            data.title.trim()
        ) {
            return data.title
        }

        if (
            data &&
            typeof data === 'object' &&
            'detail' in data &&
            typeof data.detail === 'string' &&
            data.detail.trim()
        ) {
            return data.detail
        }
    }

    return 'No se pudo cambiar la contraseña. Revisa los datos e inténtalo nuevamente.'
}

export default function ChangePasswordPage() {
    const { user, changePassword, logout } = useAuth()
    const navigate = useNavigate()

    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [errors, setErrors] = useState<string[]>([])
    const [serverError, setServerError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (isSubmitting) return

        const validationErrors: string[] = []

        if (!currentPassword) {
            validationErrors.push('Ingresa tu contraseña actual.')
        }

        if (newPassword.length < 4) {
            validationErrors.push('La nueva contraseña debe tener al menos 4 caracteres.')
        }

        if (newPassword.length > 64) {
            validationErrors.push('La nueva contraseña no puede superar los 64 caracteres.')
        }

        if (newPassword !== confirmPassword) {
            validationErrors.push('La confirmación de contraseña no coincide.')
        }

        setErrors(validationErrors)
        setServerError('')
        setSuccess(false)

        if (validationErrors.length > 0) return

        setIsSubmitting(true)

        try {
            await changePassword({
                currentPassword,
                newPassword,
            })

            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
            setSuccess(true)

            navigate('/', { replace: true })
        } catch (error) {
            setServerError(getChangePasswordError(error))
        } finally {
            setIsSubmitting(false)
        }
    }

    async function handleLogout() {
        if (isSubmitting) return

        try {
            await logout()
        } finally {
            navigate('/login', { replace: true })
        }
    }

    if (!user) {
        return null
    }

    return (
        <main className="flex min-h-dvh flex-col bg-mesa-canvas px-4 py-4 text-mesa-text sm:px-6 sm:py-6">
            <section
                className="m-auto w-full max-w-md rounded-2xl border border-mesa-border bg-white p-5 shadow-sm sm:p-8"
                aria-labelledby="change-password-title"
            >
                <div className="mb-6 space-y-3">
                    <BrandLogo size="login" />

                    <h1
                        id="change-password-title"
                        className="text-2xl font-semibold tracking-tight"
                    >
                        Cambiar contraseña
                    </h1>

                    <p className="text-sm leading-6 text-mesa-muted">
                        {user.mustChangePassword
                            ? 'Por seguridad, debes establecer una nueva contraseña antes de continuar.'
                            : 'Actualiza la contraseña de tu cuenta.'}
                    </p>
                </div>

                <form
                    className="space-y-5"
                    onSubmit={handleSubmit}
                    noValidate
                    aria-busy={isSubmitting}
                >
                    <div className="space-y-2">
                        <label
                            htmlFor="current-password"
                            className="block text-sm font-medium"
                        >
                            Contraseña actual
                        </label>

                        <input
                            id="current-password"
                            name="currentPassword"
                            type="password"
                            autoComplete="current-password"
                            value={currentPassword}
                            onChange={(event) => setCurrentPassword(event.target.value)}
                            disabled={isSubmitting}
                            className="mesa-input"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="new-password"
                            className="block text-sm font-medium"
                        >
                            Nueva contraseña
                        </label>

                        <input
                            id="new-password"
                            name="newPassword"
                            type="password"
                            autoComplete="new-password"
                            minLength={4}
                            maxLength={64}
                            value={newPassword}
                            onChange={(event) => setNewPassword(event.target.value)}
                            disabled={isSubmitting}
                            className="mesa-input"
                            required
                        />

                        <p className="text-sm leading-relaxed text-mesa-muted">
                            Entre 4 y 64 caracteres. No necesitas mayúsculas, minúsculas,
                            números ni caracteres especiales.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="confirm-password"
                            className="block text-sm font-medium"
                        >
                            Confirmar nueva contraseña
                        </label>

                        <input
                            id="confirm-password"
                            name="confirmPassword"
                            type="password"
                            autoComplete="new-password"
                            minLength={4}
                            maxLength={64}
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            disabled={isSubmitting}
                            className="mesa-input"
                            required
                        />
                    </div>

                    {errors.length > 0 && (
                        <Alert>
                            <ul className="list-disc space-y-1 pl-5">
                                {errors.map((message) => (
                                    <li key={message}>{message}</li>
                                ))}
                            </ul>
                        </Alert>
                    )}

                    {serverError && <Alert>{serverError}</Alert>}

                    {success && (
                        <Alert variant="success">
                            Contraseña actualizada correctamente.
                        </Alert>
                    )}

                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        loading={isSubmitting}
                        className="w-full"
                    >
                        {isSubmitting
                            ? 'Guardando...'
                            : 'Cambiar contraseña'}
                    </Button>

                    <button
                        type="button"
                        onClick={() => void handleLogout()}
                        disabled={isSubmitting}
                        className="w-full text-sm font-medium text-mesa-muted underline-offset-4 hover:underline"
                    >
                        Cerrar sesión
                    </button>
                </form>
            </section>
        </main>
    )
}