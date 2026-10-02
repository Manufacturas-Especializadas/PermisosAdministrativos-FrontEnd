import api from './http'
import type { CreateDepartmentRequest, Department } from '../features/departments/departments.types'

export async function getDepartments(signal?: AbortSignal): Promise<Department[]> {
  const response = await api.get<Department[]>('/api/departments', { signal })
  return response.data
}

export async function createDepartment(request: CreateDepartmentRequest): Promise<{ id: number }> {
  const response = await api.post<{ id: number }>('/api/departments', request)
  return response.data
}
