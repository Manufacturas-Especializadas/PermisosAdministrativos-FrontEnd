import { useQuery } from '@tanstack/react-query'
import { getApprovedPersonalPermits } from '../../../api/personalPermitsApi'
import { useAuth } from '../../../auth/AuthContext'

export function useApprovedPersonalPermits() {
    const { user } = useAuth()

    return useQuery({
        queryKey: ['personal-permits', 'approved', user?.userId],
        queryFn: ({ signal }) => getApprovedPersonalPermits(signal),
        enabled: user !== null,
        refetchInterval: 30_000,
        refetchIntervalInBackground: false,
    })
}
