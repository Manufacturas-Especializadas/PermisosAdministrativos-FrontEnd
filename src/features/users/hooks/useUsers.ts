import { useQuery } from '@tanstack/react-query'
import { getUsers } from '../../../api/usersApi'
import { useAuth } from '../../../auth/AuthContext'

export function useUsers() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['users', user?.userId],
    queryFn: ({ signal }) => getUsers(signal),
    enabled: user !== null,
  })
}
