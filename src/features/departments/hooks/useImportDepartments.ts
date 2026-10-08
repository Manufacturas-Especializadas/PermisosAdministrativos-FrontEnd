import { useMutation, useQueryClient } from '@tanstack/react-query'
import { importDepartments } from '../../../api/departmentsApi'
import { useAuth } from '../../../auth/AuthContext'

export function useImportDepartments() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: importDepartments,
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: ['departments', user?.userId],
      exact: true,
    }),
  })
}
