import api from '../api/http'
import type { AuthUser } from './auth.types'

export interface LoginRequest {
    userName: string
    password: string
}

export interface ChangePasswordRequest {
    currentPassword: string
    newPassword: string
}

export async function login(request: LoginRequest) {
    await api.post('/api/auth/login', request)
}

export async function getCurrentUser(): Promise<AuthUser> {
    const response = await api.get<AuthUser>('/api/auth/me')

    return response.data
}

export async function changePassword(request: ChangePasswordRequest) {
    await api.post('/api/auth/change-password', request)
}

export async function logout() {
    await api.post('/api/auth/logout')
}