import { useMutation, useQueryClient } from '@tanstack/react-query'
import { rejectPersonalPermit, type RejectPersonalPermitRequest } from '../../../api/personalPermitsApi'
import { useAuth } from '../../../auth/AuthContext'
import { isPersonalPermitConflict } from '../personalPermit.errors'

export function useRejectPersonalPermit() {
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
        mutationFn: ({ permitId, request }: {
            permitId: number
            request: RejectPersonalPermitRequest
        }) => rejectPersonalPermit(permitId, request),
        onSuccess: invalidatePermitQueries,
        onError: (error) => {
            if (isPersonalPermitConflict(error)) return invalidatePermitQueries()
        },
    })
}
