import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
})

export function registerUnauthorizedHandler(onUnauthorized: () => void): () => void {
    const interceptorId = api.interceptors.response.use(
        (response) => response,
        (error: unknown) => {
            if (
                axios.isAxiosError(error) &&
                error.response?.status === 401 &&
                error.config?.url !== '/api/auth/login'
            ) {
                onUnauthorized()
            }

            return Promise.reject(error)
        },
    )

    return () => api.interceptors.response.eject(interceptorId)
}

export default api
