import api from './http'
import type {
    ApprovedPersonalPermit,
    PersonalPermitHistoryResult,
    PersonalPermitStatus,
    PersonalPermitType,
    PendingPersonalPermit,
} from '../features/personalPermits/personalPermit.types'

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

export async function getApprovedPersonalPermits(
    signal?: AbortSignal,
): Promise<ApprovedPersonalPermit[]> {
    const response = await api.get<ApprovedPersonalPermit[]>(
        '/api/personal-permits/approved',
        {
            signal,
        },
    )

    return response.data
}

export async function completePersonalPermit(
    permitId: number,
): Promise<void> {
    await api.post(`/api/personal-permits/${permitId}/complete`)
}

export interface GetPersonalPermitsParams {
    employeeId?: number
    status?: PersonalPermitStatus
    fromDate?: string
    toDate?: string
    page?: number
    pageSize?: number
}

export async function getPersonalPermits(
    params: GetPersonalPermitsParams,
    signal?: AbortSignal,
): Promise<PersonalPermitHistoryResult> {
    const response = await api.get<PersonalPermitHistoryResult>(
        '/api/personal-permits',
        {
            params,
            signal,
        },
    )

    return response.data
}
