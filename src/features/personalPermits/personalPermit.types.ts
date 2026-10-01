export type PersonalPermitType =
    | 1
    | 2
    | 3
    | 4
    | 5

export interface PersonalPermitForm {
    employeeId: number | null
    permitDate: string
    exitTime: string
    permitType: PersonalPermitType | null
    reason: string
}