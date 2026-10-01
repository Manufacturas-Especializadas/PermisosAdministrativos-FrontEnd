import { useQuery } from '@tanstack/react-query'
import { getPendingPersonalPermits } from '../../../api/personalPermitsApi'
import { useAuth } from '../../../auth/AuthContext'

export function usePendingPersonalPermits() {
    const { user } = useAuth()

    return useQuery({
        queryKey: ['personal-permits', 'pending', user?.userId],
        queryFn: ({ signal }) => getPendingPersonalPermits(signal),
        enabled: user !== null,
    })
}