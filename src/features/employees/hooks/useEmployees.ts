import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getEmployees } from '../../../api/employeesApi'
import { useAuth } from '../../../auth/AuthContext'

export function useEmployees(page: number, pageSize: number) {
  const { user } = useAuth()

  return useQuery({
    // Evita compartir los datos en caché entre usuarios de distintas sesiones.
    queryKey: ['employees', user?.userId, page, pageSize],
    queryFn: ({ signal }) => getEmployees(page, pageSize, signal),
    placeholderData: keepPreviousData,
    enabled: user !== null,
  })
}
