import { useMutation, useQueryClient } from '@tanstack/react-query'
import { importEmployees } from '../../../api/employeesApi'
import { useAuth } from '../../../auth/AuthContext'

export function useImportEmployees() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: importEmployees,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['employees', user?.userId] }),
        queryClient.invalidateQueries({ queryKey: ['employees', 'search', user?.userId] }),
      ])
    },
  })
}
