import { useQuery } from '@tanstack/react-query'
import { getEmployees } from '../../../api/employeesApi'
import { useAuth } from '../../../auth/AuthContext'

export function useEmployeeSearch(search: string) {
    const { user } = useAuth()

    const normalizedSearch = search.trim()

    return useQuery({
        queryKey: ['employees', 'search', user?.userId, normalizedSearch],
        queryFn: ({ signal }) =>
            getEmployees(
                1,
                10,
                normalizedSearch,
                true,
                signal,
            ),
        enabled: user !== null && normalizedSearch.length >= 2,
    })
}