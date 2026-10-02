import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createUser } from '../../../api/usersApi'
import { useAuth } from '../../../auth/AuthContext'

export function useCreateUser() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: ['users', user?.userId],
      exact: true,
    }),
  })
}
