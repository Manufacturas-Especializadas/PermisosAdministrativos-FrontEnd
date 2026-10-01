import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getEmployees } from '../../../api/employeesApi'
import { useAuth } from '../../../auth/AuthContext'

export function useEmployees(
  page: number,
  pageSize: number,
  search: string,
  isActive: boolean | null,
) {
  const { user } = useAuth()

  const normalizedSearch = search.trim()

  return useQuery({
    queryKey: [
      'employees',
      user?.userId,
      {
        search: normalizedSearch,
        isActive,
        page,
        pageSize,
      },
    ],
    queryFn: ({ signal }) =>
      getEmployees(
        page,
        pageSize,
        normalizedSearch,
        isActive,
        signal,
      ),
    placeholderData: keepPreviousData,
    enabled: user !== null,
  })
}