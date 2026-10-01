import api from './http'
import type { EmployeesResponse } from '../features/employees/employees.types'

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