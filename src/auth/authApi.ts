import api from '../api/http'

export interface LoginRequest {
    userName: string
    password: string
}

export async function login(request: LoginRequest) {
    return api.post('/api/auth/login', request)
}