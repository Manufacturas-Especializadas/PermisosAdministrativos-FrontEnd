import api from './http'
import type { EmployeesResponse } from '../features/employees/employees.types'

export async function getEmployees(
  page: number,
  pageSize: number,
  signal?: AbortSignal,
): Promise<EmployeesResponse> {
  const response = await api.get<EmployeesResponse>('/api/employees', {
    params: { page, pageSize },
    signal,
  })

  return response.data
}
