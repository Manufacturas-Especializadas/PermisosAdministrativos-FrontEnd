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

export function getPersonalPermitReviewError(
    error: unknown,
    action: 'approve' | 'reject',
): string {
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

    return action === 'approve'
        ? 'No se pudo aprobar el permiso. Inténtalo nuevamente.'
        : 'No se pudo rechazar el permiso. Inténtalo nuevamente.'
}
