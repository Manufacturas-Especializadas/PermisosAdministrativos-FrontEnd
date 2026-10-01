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
        const loadCurrentUser = async () => {
            try {
                const currentUser = await getCurrentUser()
                setUser(currentUser)
            } catch {
                setUser(null)
            } finally {
                setIsLoading(false)
            }
        }

        loadCurrentUser()
    }, [])

    const login = async (request: LoginRequest) => {
        await loginRequest(request)

        const currentUser = await getCurrentUser()

        setUser(currentUser)
    }

    const logout = async () => {
        await logoutRequest()
        setUser(null)
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

export function useAuth() {
    const context = useContext(AuthContext)

    if (!context) {
        throw new Error('useAuth debe utilizarse dentro de AuthProvider.')
    }

    return context
}