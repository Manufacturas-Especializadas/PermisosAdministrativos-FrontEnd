import { useMutation, useQueryClient } from '@tanstack/react-query'
import { setUserStatus } from '../../../api/usersApi'
import { useAuth } from '../../../auth/AuthContext'
import type { SetUserStatusRequest } from '../users.types'

export function useSetUserStatus() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, request }: { userId: string; request: SetUserStatusRequest }) =>
      setUserStatus(userId, request),
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: ['users', user?.userId],
      exact: true,
    }),
  })
}
