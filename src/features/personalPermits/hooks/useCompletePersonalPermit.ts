import { useMutation, useQueryClient } from '@tanstack/react-query'
import { completePersonalPermit } from '../../../api/personalPermitsApi'
import { useAuth } from '../../../auth/AuthContext'
import { isPersonalPermitCompletionConflict } from '../personalPermit.errors'

export function useCompletePersonalPermit() {
    const { user } = useAuth()
    const queryClient = useQueryClient()
    const invalidateApproved = () => queryClient.invalidateQueries({
        queryKey: ['personal-permits', 'approved', user?.userId],
        exact: true,
    })

    return useMutation({
        mutationFn: completePersonalPermit,
        onSuccess: invalidateApproved,
        onError: (error) => {
            if (isPersonalPermitCompletionConflict(error)) return invalidateApproved()
        },
    })
}
