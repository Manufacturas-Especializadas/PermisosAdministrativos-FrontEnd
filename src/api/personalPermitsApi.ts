import api from './http'
import type { PersonalPermitType } from '../features/personalPermits/personalPermit.types'

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