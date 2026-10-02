import api from './http'
import type { EmployeeImportResult, EmployeesResponse } from '../features/employees/employees.types'

export async function importEmployees(file: File): Promise<EmployeeImportResult> {
  const formData = new FormData()
  formData.append('File', file)

  const response = await api.post<EmployeeImportResult>('/api/employees/import', formData, {
    // Retira el valor JSON heredado; Axios/browser genera el multipart boundary.
    headers: { 'Content-Type': undefined },
  })
  return response.data
}

export async function getEmployees(
  page: number,
  pageSize: number,
  search = '',
  isActive: boolean | null = null,
  signal?: AbortSignal,
): Promise<EmployeesResponse> {
  const trimmedSearch = search.trim()

  const params: Record<string, string | number | boolean> = {
    page,
    pageSize,
  }

  if (trimmedSearch) {
    params.search = trimmedSearch
  }

  if (isActive !== null) {
    params.isActive = isActive
  }

  const response = await api.get<EmployeesResponse>('/api/employees', {
    params,
    signal,
  })

  return response.data
}
