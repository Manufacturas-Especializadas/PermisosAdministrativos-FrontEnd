import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react'

import {
    getCurrentUser,
    login as loginRequest,
    logout as logoutRequest,
} from './authApi'

import type { AuthUser } from './auth.types'
import type { LoginRequest } from './authApi'
import { registerUnauthorizedHandler } from '../api/http'
import { queryClient } from '../api/queryClient'
import { clearCsrfToken, fetchCsrfToken } from '../api/csrf'

interface AuthContextValue {
    user: AuthUser | null
    isLoading: boolean
    isAuthenticated: boolean
    login: (request: LoginRequest) => Promise<void>
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps {
    children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const mounted = useRef(false)

    useEffect(() => {
        mounted.current = true
        let active = true
        const unregisterUnauthorizedHandler = registerUnauthorizedHandler(() => {
            if (!active) return
            setUser(null)
            queryClient.clear()
        })

        const loadCurrentUser = async () => {
            try {
                await fetchCsrfToken()
                if (!active) return
                const currentUser = await getCurrentUser()
                if (active) setUser(currentUser)
            } catch {
                if (active) {
                    clearCsrfToken()
                    setUser(null)
                }
            } finally {
                if (active) setIsLoading(false)
            }
        }

        loadCurrentUser()

        return () => {
            active = false
            mounted.current = false
            unregisterUnauthorizedHandler()
            // StrictMode vuelve a montar el efecto inmediatamente: conserva su
            // solicitud compartida y limpia solo si el proveedor sigue desmontado.
            queueMicrotask(() => {
                if (!mounted.current) clearCsrfToken()
            })
        }
    }, [])

    const login = async (request: LoginRequest) => {
        try {
            await fetchCsrfToken()
            await loginRequest(request)
            clearCsrfToken()
            await fetchCsrfToken()
            const currentUser = await getCurrentUser()
            setUser(currentUser)
        } catch (error) {
            clearCsrfToken()
            throw error
        }
    }

    const logout = async () => {
        await logoutRequest()
        setUser(null)
        queryClient.clear()
        clearCsrfToken()
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: user !== null,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

// eslint-disable-next-line react-refresh/only-export-components -- Se conserva el hook junto al proveedor; este módulo puede requerir una recarga completa en desarrollo.
export function useAuth() {
    const context = useContext(AuthContext)

    if (!context) {
        throw new Error('useAuth debe utilizarse dentro de AuthProvider.')
    }

    return context
}
