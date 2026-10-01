import { useMutation, useQueryClient } from '@tanstack/react-query'
import { approvePersonalPermit } from '../../../api/personalPermitsApi'
import { useAuth } from '../../../auth/AuthContext'
import { isPersonalPermitConflict } from '../personalPermit.errors'

export function useApprovePersonalPermit() {
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
        mutationFn: approvePersonalPermit,
        onSuccess: invalidatePermitQueries,
        onError: (error) => {
            if (isPersonalPermitConflict(error)) return invalidatePermitQueries()
        },
    })
}
