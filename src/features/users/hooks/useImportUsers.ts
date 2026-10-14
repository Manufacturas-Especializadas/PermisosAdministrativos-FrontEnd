import { useMutation, useQueryClient } from '@tanstack/react-query'
import { importUsers } from '../../../api/usersApi'
import { useAuth } from '../../../auth/AuthContext'

export function useImportUsers() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: importUsers,
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: ['users', user?.userId],
      exact: true,
    }),
  })
}
