import api from './http'
import type { PersonalPermitType, PendingPersonalPermit } from '../features/personalPermits/personalPermit.types'

export interface CreatePersonalPermitRequest {
    employeeId: number
    permitDate: string
    exitTime: string
    permitType: PersonalPermitType
    reason: string
}

export async function createPersonalPermit(
    request: CreatePersonalPermitRequest,
): Promise<void> {
    await api.post('/api/personal-permits', request)
}

export async function getPendingPersonalPermits(
    signal?: AbortSignal,
): Promise<PendingPersonalPermit[]> {
    const response = await api.get<PendingPersonalPermit[]>(
        '/api/personal-permits/pending',
        {
            signal,
        },
    )

    return response.data
}