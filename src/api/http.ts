import axios from 'axios'
import { clearCsrfToken, fetchCsrfToken, getCsrfToken } from './csrf'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
})

function isUnsafeMethod(method?: string): boolean {
    return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method?.toUpperCase() ?? '')
}

api.interceptors.request.use(async (config) => {
    if (isUnsafeMethod(config.method)) {
        const token = getCsrfToken() ?? await fetchCsrfToken()
        config.headers.set('X-CSRF-TOKEN', token)
    }
    return config
})

export function registerUnauthorizedHandler(onUnauthorized: () => void): () => void {
    const interceptorId = api.interceptors.response.use(
        (response) => response,
        (error: unknown) => {
            if (
                axios.isAxiosError(error) &&
                error.response?.status === 400 &&
                isUnsafeMethod(error.config?.method)
            ) {
                // El backend no distingue CSRF de otros 400. Conserva el error;
                // la próxima escritura obtendrá un token nuevo sin reenviar esta.
                clearCsrfToken()
            }
            if (
                axios.isAxiosError(error) &&
                error.response?.status === 401 &&
                error.config?.url !== '/api/auth/login'
            ) {
                clearCsrfToken()
                onUnauthorized()
            }

            return Promise.reject(error)
        },
    )

    return () => api.interceptors.response.eject(interceptorId)
}

export default api
