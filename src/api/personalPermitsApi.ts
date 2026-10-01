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

export async function approvePersonalPermit(
    permitId: number,
): Promise<void> {
    await api.post(`/api/personal-permits/${permitId}/approve`)
}

export interface RejectPersonalPermitRequest {
    reason: string
}

export async function rejectPersonalPermit(
    permitId: number,
    request: RejectPersonalPermitRequest,
): Promise<void> {
    await api.post(`/api/personal-permits/${permitId}/reject`, request)
}
