import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createDepartment } from '../../../api/departmentsApi'
import { useAuth } from '../../../auth/AuthContext'

export function useCreateDepartment() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createDepartment,
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: ['departments', user?.userId],
      exact: true,
    }),
  })
}
