import type { PersonalPermitType } from './personalPermit.types'

export const permitTypeLabels: Record<PersonalPermitType, string> = {
    1: 'Salir',
    2: 'Personal',
    3: 'Comer',
    4: 'IMSS',
    5: 'Banco',
}

export function formatPermitDate(permitDate: string): string {
    const [year, month, day] = permitDate.split('-')
    return `${day}/${month}/${year}`
}
