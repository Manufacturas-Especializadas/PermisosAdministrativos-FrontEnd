import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getMyPersonalPermits } from '../../../api/personalPermitsApi'
import { useAuth } from '../../../auth/AuthContext'

export function useMyPersonalPermits(page: number, pageSize: number) {
    const { user } = useAuth()

    return useQuery({
        queryKey: [
            'personal-permits',
            'my',
            user?.userId,
            page,
            pageSize,
        ],
        queryFn: ({ signal }) =>
            getMyPersonalPermits(page, pageSize, signal),
        placeholderData: keepPreviousData,
        staleTime: 0,
        refetchOnWindowFocus: false,
        refetchInterval: 30_000,
        refetchIntervalInBackground: false,
        enabled: user !== null,
    })
}
