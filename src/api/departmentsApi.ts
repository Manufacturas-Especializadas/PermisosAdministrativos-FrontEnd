import api from './http'
import type { CreateDepartmentRequest, Department, DepartmentImportResult } from '../features/departments/departments.types'

export async function getDepartments(signal?: AbortSignal): Promise<Department[]> {
  const response = await api.get<Department[]>('/api/departments', { signal })
  return response.data
}

export async function createDepartment(request: CreateDepartmentRequest): Promise<{ id: number }> {
  const response = await api.post<{ id: number }>('/api/departments', request)
  return response.data
}

export async function importDepartments(file: File): Promise<DepartmentImportResult> {
  const formData = new FormData()
  formData.append('File', file)

  const response = await api.post<DepartmentImportResult>('/api/departments/import', formData, {
    // Retira el valor JSON heredado; Axios/browser genera el multipart boundary.
    headers: { 'Content-Type': undefined },
  })
  return response.data
}
