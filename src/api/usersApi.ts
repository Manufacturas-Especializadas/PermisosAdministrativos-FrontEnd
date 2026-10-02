import api from './http'
import type { CreateUserRequest, SetUserStatusRequest, User } from '../features/users/users.types'

export async function getUsers(signal?: AbortSignal): Promise<User[]> {
  const response = await api.get<User[]>('/api/users', { signal })
  return response.data
}

export async function createUser(request: CreateUserRequest): Promise<{ userId: string }> {
  const response = await api.post<{ userId: string }>('/api/users', request)
  return response.data
}

export async function setUserStatus(userId: string, request: SetUserStatusRequest): Promise<void> {
  await api.patch(`/api/users/${encodeURIComponent(userId)}/status`, request)
}
