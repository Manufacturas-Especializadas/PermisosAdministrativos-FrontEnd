import api from './http'

let csrfToken: string | null = null
let pendingRequest: Promise<string> | null = null
let tokenVersion = 0

export function getCsrfToken(): string | null {
    return csrfToken
}

export function setCsrfToken(token: string): void {
    tokenVersion += 1
    csrfToken = token
}

export function clearCsrfToken(): void {
    tokenVersion += 1
    csrfToken = null
    pendingRequest = null
}

export function fetchCsrfToken(): Promise<string> {
    if (pendingRequest) return pendingRequest

    const version = tokenVersion
    const request = api.get<{ token: unknown }>('/api/auth/csrf')
        .then(({ data }) => {
            // Una respuesta anterior a logout/401 no debe restaurar el token.
            if (version !== tokenVersion) throw new Error('La sesión CSRF cambió.')
            if (typeof data.token !== 'string' || !data.token.trim()) {
                throw new Error('No se pudo obtener el token CSRF.')
            }
            setCsrfToken(data.token)
            return data.token
        })
        .finally(() => {
            if (pendingRequest === request) pendingRequest = null
        })

    pendingRequest = request
    return request
}
