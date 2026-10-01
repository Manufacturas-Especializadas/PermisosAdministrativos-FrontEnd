export type PersonalPermitType = 1 | 2 | 3 | 4 | 5

export type PersonalPermitStatus = 1 | 2 | 3 | 4 | 5

export interface PersonalPermitForm {
    employeeId: number | null
    permitDate: string
    exitTime: string
    permitType: PersonalPermitType | null
    reason: string
}

export interface PendingPersonalPermit {
    id: number
    employeeId: number
    payrollNumber: string
    employeeName: string
    permitDate: string
    exitTime: string
    permitType: PersonalPermitType
    reason: string
}

export interface ApprovedPersonalPermit {
    id: number
    employeeId: number
    payrollNumber: string
    employeeName: string
    permitDate: string
    exitTime: string
    permitType: PersonalPermitType
    reason: string
}

export interface PersonalPermitHistoryItem {
    id: number
    employeeId: number
    payrollNumber: string
    employeeName: string
    permitDate: string
    exitTime: string
    permitType: PersonalPermitType
    reason: string
    status: PersonalPermitStatus
}

export interface PersonalPermitHistoryResult {
    items: PersonalPermitHistoryItem[]
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
}
