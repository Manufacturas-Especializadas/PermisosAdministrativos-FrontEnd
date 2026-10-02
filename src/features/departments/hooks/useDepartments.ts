import { useQuery } from '@tanstack/react-query'
import { getDepartments } from '../../../api/departmentsApi'
import { useAuth } from '../../../auth/AuthContext'

export function useDepartments() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['departments', user?.userId],
    queryFn: ({ signal }) => getDepartments(signal),
    enabled: user !== null,
  })
}
