import {
    createContext,
    useContext,
    useEffect,
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

    useEffect(() => {
        let active = true
        const unregisterUnauthorizedHandler = registerUnauthorizedHandler(() => {
            if (!active) return
            setUser(null)
            queryClient.clear()
        })

        const loadCurrentUser = async () => {
            try {
                const currentUser = await getCurrentUser()
                if (active) setUser(currentUser)
            } catch {
                if (active) setUser(null)
            } finally {
                if (active) setIsLoading(false)
            }
        }

        loadCurrentUser()

        return () => {
            active = false
            unregisterUnauthorizedHandler()
        }
    }, [])

    const login = async (request: LoginRequest) => {
        await loginRequest(request)

        const currentUser = await getCurrentUser()

        setUser(currentUser)
    }

    const logout = async () => {
        await logoutRequest()
        setUser(null)
        queryClient.clear()
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
