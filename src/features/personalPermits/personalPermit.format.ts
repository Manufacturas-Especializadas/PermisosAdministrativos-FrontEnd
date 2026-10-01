import type { PersonalPermitStatus, PersonalPermitType } from './personalPermit.types'

export const permitTypeLabels: Record<PersonalPermitType, string> = {
    1: 'Salir',
    2: 'Personal',
    3: 'Comer',
    4: 'IMSS',
    5: 'Banco',
}

export const permitStatusLabels: Record<PersonalPermitStatus, string> = {
    1: 'Pendiente de RH',
    2: 'Aprobado',
    3: 'Rechazado',
    4: 'Cancelado',
    5: 'Completado',
}

export function formatPermitDate(permitDate: string): string {
    const [year, month, day] = permitDate.split('-')
    return `${day}/${month}/${year}`
}
