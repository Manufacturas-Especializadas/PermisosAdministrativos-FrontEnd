import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createPersonalPermit } from '../../../api/personalPermitsApi'
import { useAuth } from '../../../auth/AuthContext'

export function useCreatePersonalPermit() {
    const { user } = useAuth()
    const queryClient = useQueryClient()
    const invalidatePermitQueries = async () => {
        await Promise.all([
            queryClient.invalidateQueries({
                queryKey: ['personal-permits', 'pending', user?.userId],
                exact: true,
            }),
            queryClient.invalidateQueries({
                queryKey: ['personal-permits', 'history', user?.userId],
            }),
        ])
    }

    return useMutation({
        mutationFn: createPersonalPermit,
        onSuccess: invalidatePermitQueries,
    })
}
