import { isAxiosError } from 'axios'

interface PersonalPermitProblem {
    title?: string
}

export function isPersonalPermitConflict(error: unknown): boolean {
    if (!isAxiosError<PersonalPermitProblem>(error)) return false

    // GlobalExceptionHandler devuelve 400 para InvalidOperationException.
    return error.response?.status === 409 || (
        error.response?.status === 400 &&
        error.response.data?.title === 'El permiso ya fue procesado.'
    )
}

export function isPersonalPermitCompletionConflict(error: unknown): boolean {
    if (isPersonalPermitConflict(error)) return true
    if (!isAxiosError<PersonalPermitProblem>(error)) return false

    return error.response?.status === 400 && (
        error.response.data?.title === 'El permiso no está aprobado.' ||
        error.response.data?.title === 'Solo se pueden registrar salidas correspondientes al día actual.'
    )
}

export function getPersonalPermitReviewError(
    error: unknown,
    action: 'approve' | 'reject' | 'complete',
): string {
    if (action === 'complete' && isPersonalPermitCompletionConflict(error)) {
        return 'No se pudo registrar la salida: el permiso ya no está aprobado, no corresponde al día actual o existe un conflicto con su estado. Se solicitó actualizar las salidas autorizadas.'
    }

    if (isPersonalPermitConflict(error)) {
        return 'El permiso ya fue procesado o existe un conflicto con su estado. Se solicitó actualizar la lista de pendientes.'
    }

    if (isAxiosError<PersonalPermitProblem>(error)) {
        if (error.response?.status === 401) {
            return 'Tu sesión ha expirado. Vuelve a iniciar sesión para procesar permisos.'
        }

        if (error.response?.status === 403) {
            return 'No tienes autorización para procesar este permiso.'
        }

        if (error.response?.status === 400 && typeof error.response.data?.title === 'string') {
            return error.response.data.title
        }
    }

    if (action === 'complete') {
        return 'No se pudo registrar la salida. Inténtalo nuevamente.'
    }

    return action === 'approve'
        ? 'No se pudo aprobar el permiso. Inténtalo nuevamente.'
        : 'No se pudo rechazar el permiso. Inténtalo nuevamente.'
}
