import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getPersonalPermits, type GetPersonalPermitsParams } from '../../../api/personalPermitsApi'
import { useAuth } from '../../../auth/AuthContext'

export function usePersonalPermitHistory(filters: GetPersonalPermitsParams) {
    const { user } = useAuth()

    return useQuery({
        queryKey: ['personal-permits', 'history', user?.userId, filters],
        queryFn: ({ signal }) => getPersonalPermits(filters, signal),
        placeholderData: keepPreviousData,
        staleTime: 0,
        refetchOnWindowFocus: false,
        enabled: user !== null,
    })
}
