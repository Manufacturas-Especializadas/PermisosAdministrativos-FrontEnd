import { useMutation, useQueryClient } from '@tanstack/react-query'
import { completePersonalPermit } from '../../../api/personalPermitsApi'
import { useAuth } from '../../../auth/AuthContext'
import { isPersonalPermitCompletionConflict } from '../personalPermit.errors'

export function useCompletePersonalPermit() {
    const { user } = useAuth()
    const queryClient = useQueryClient()
    const invalidatePermitQueries = async () => {
        await Promise.all([
            queryClient.invalidateQueries({
                queryKey: ['personal-permits', 'approved', user?.userId],
                exact: true,
            }),
            queryClient.invalidateQueries({
                queryKey: ['personal-permits', 'history', user?.userId],
            }),
        ])
    }

    return useMutation({
        mutationFn: completePersonalPermit,
        onSuccess: invalidatePermitQueries,
        onError: (error) => {
            if (isPersonalPermitCompletionConflict(error)) return invalidatePermitQueries()
        },
    })
}
