import { useMutation, useQueryClient } from '@tanstack/react-query'
import { approvePersonalPermit } from '../../../api/personalPermitsApi'
import { useAuth } from '../../../auth/AuthContext'
import { isPersonalPermitConflict } from '../personalPermit.errors'

export function useApprovePersonalPermit() {
    const { user } = useAuth()
    const queryClient = useQueryClient()
    const invalidatePending = () => queryClient.invalidateQueries({
        queryKey: ['personal-permits', 'pending', user?.userId],
        exact: true,
    })

    return useMutation({
        mutationFn: approvePersonalPermit,
        onSuccess: invalidatePending,
        onError: (error) => {
            if (isPersonalPermitConflict(error)) return invalidatePending()
        },
    })
}
