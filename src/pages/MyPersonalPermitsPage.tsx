import { isAxiosError } from 'axios'
import { useEffect, useState } from 'react'
import Alert from '../components/Alert'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import LoadingState, { Spinner } from '../components/LoadingState'
import StatusBadge from '../components/StatusBadge'
import TableContainer from '../components/TableContainer'
import { useMyPersonalPermits } from '../features/employees/hooks/useMyPersonalPermits'
import {
    formatPermitDate,
    permitStatusLabels,
    permitTypeLabels,
} from '../features/personalPermits/personalPermit.format'
import type { PersonalPermitStatus } from '../features/personalPermits/personalPermit.types'

const permitStatusTones: Record<
    PersonalPermitStatus,
    'success' | 'neutral' | 'warning' | 'info' | 'error'
> = {
    1: 'warning',
    2: 'info',
    3: 'error',
    4: 'neutral',
    5: 'success',
}

const permitStatusDescriptions: Record<PersonalPermitStatus, string> = {
    1: 'La solicitud está pendiente de revisión por Recursos Humanos.',
    2: 'La solicitud fue aprobada por Recursos Humanos.',
    3: 'La solicitud fue rechazada por Recursos Humanos.',
    4: 'La solicitud fue cancelada.',
    5: 'La salida ya fue registrada por Seguridad.',
}

function formatActualExit(actualExitAt: string | null): string | null {
    if (!actualExitAt) return null

    const date = new Date(actualExitAt)

    if (Number.isNaN(date.getTime())) {
        return actualExitAt
    }

    return new Intl.DateTimeFormat('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(date)
}

export default function MyPersonalPermitsPage() {
    const [page, setPage] = useState(1)
    const pageSize = 25

    const {
        data,
        isPending,
        isFetching,
        isPlaceholderData,
        isError,
        error,
        refetch,
    } = useMyPersonalPermits(page, pageSize)

    const sessionExpired =
        isAxiosError(error) && error.response?.status === 401

    const canGoPrevious =
        page > 1 &&
        !isFetching &&
        !isPlaceholderData

    const canGoNext =
        !!data &&
        !isError &&
        !isFetching &&
        !isPlaceholderData &&
        page < data.totalPages

    useEffect(() => {
        if (
            data &&
            !isPlaceholderData &&
            page > Math.max(1, data.totalPages)
        ) {
            setPage(Math.max(1, data.totalPages))
        }
    }, [data, page, isPlaceholderData])

    return (
        <section
            aria-labelledby="my-personal-permits-title"
            className="min-w-0 space-y-6 text-mesa-text"
        >
            <header className="mesa-page-header">
                <h1
                    id="my-personal-permits-title"
                    className="mesa-page-title"
                >
                    Mis permisos
                </h1>
            </header>

            <section
                aria-labelledby="my-personal-permits-results-title"
                className="min-w-0 space-y-4"
            >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                        <h2
                            id="my-personal-permits-results-title"
                            className="text-lg font-semibold"
                        >
                            Solicitudes
                        </h2>

                        <div
                            className="min-h-6 text-sm text-mesa-muted"
                            role="status"
                            aria-live="polite"
                        >
                            {isPending ? (
                                <span>Cargando tus permisos...</span>
                            ) : isFetching ? (
                                <span className="inline-flex items-center gap-2">
                                    <Spinner />
                                    Actualizando...
                                </span>
                            ) : data && !isError ? (
                                <span>
                                    Mostrando {data.items.length} de{' '}
                                    {data.totalCount} permisos.
                                </span>
                            ) : null}
                        </div>
                    </div>

                    <Button
                        type="button"
                        variant="secondary"
                        disabled={isFetching}
                        loading={isFetching}
                        loadingText="Actualizando..."
                        onClick={() => void refetch()}
                        className="w-full sm:w-auto"
                    >
                        Actualizar
                    </Button>
                </div>

                {isError && (
                    <Alert
                        variant={sessionExpired ? 'error' : 'warning'}
                        title={
                            sessionExpired
                                ? 'Sesión expirada'
                                : 'No se pudo actualizar la información'
                        }
                    >
                        {sessionExpired
                            ? 'Tu sesión ha expirado. Vuelve a iniciar sesión para consultar tus permisos.'
                            : 'No se pudieron actualizar tus permisos. Inténtalo nuevamente.'}
                    </Alert>
                )}

                {isPending ? (
                    <LoadingState>
                        Preparando tus permisos...
                    </LoadingState>
                ) : !data || sessionExpired ? null : data.items.length === 0 ? (
                    <EmptyState>
                        Aún no tienes permisos registrados.
                    </EmptyState>
                ) : (
                    <>
                        {/* Vista móvil */}
                        <ul
                            aria-label="Mis permisos"
                            aria-busy={isFetching}
                            className="min-w-0 space-y-4 md:hidden"
                        >
                            {data.items.map((permit) => {
                                const actualExit = formatActualExit(
                                    permit.actualExitAt,
                                )

                                return (
                                    <li
                                        key={permit.id}
                                        className="min-w-0 space-y-4 rounded-xl border border-mesa-border bg-white p-4"
                                    >
                                        <div className="flex min-w-0 items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-sm text-mesa-muted">
                                                    Solicitud #{permit.id}
                                                </p>

                                                <h3 className="mt-1 text-lg font-semibold wrap-anywhere">
                                                    {permitTypeLabels[
                                                        permit.permitType
                                                    ]}
                                                </h3>
                                            </div>

                                            <div className="shrink-0">
                                                <StatusBadge
                                                    label={
                                                        permitStatusLabels[
                                                        permit.status
                                                        ]
                                                    }
                                                    tone={
                                                        permitStatusTones[
                                                        permit.status
                                                        ]
                                                    }
                                                />
                                            </div>
                                        </div>

                                        <dl className="grid min-w-0 grid-cols-2 gap-4 text-sm">
                                            <div className="min-w-0">
                                                <dt className="text-mesa-muted">
                                                    Fecha
                                                </dt>
                                                <dd className="mt-1 font-medium tabular-nums">
                                                    {formatPermitDate(
                                                        permit.permitDate,
                                                    )}
                                                </dd>
                                            </div>

                                            <div className="min-w-0">
                                                <dt className="text-mesa-muted">
                                                    Hora de salida
                                                </dt>
                                                <dd className="mt-1 font-medium tabular-nums">
                                                    {permit.exitTime.slice(0, 5)}
                                                </dd>
                                            </div>
                                        </dl>

                                        <div className="border-t border-mesa-border pt-4">
                                            <p className="text-sm font-medium text-mesa-muted">
                                                Motivo
                                            </p>

                                            <p className="mt-1 leading-relaxed whitespace-pre-wrap wrap-anywhere">
                                                {permit.reason}
                                            </p>
                                        </div>

                                        <p className="text-sm leading-relaxed text-mesa-muted">
                                            {permitStatusDescriptions[
                                                permit.status
                                            ]}
                                        </p>

                                        {permit.status === 3 &&
                                            permit.rejectionReason && (
                                                <Alert
                                                    variant="error"
                                                    title="Motivo del rechazo"
                                                >
                                                    {permit.rejectionReason}
                                                </Alert>
                                            )}

                                        {permit.status === 5 && actualExit && (
                                            <Alert
                                                variant="success"
                                                title="Salida registrada"
                                            >
                                                {actualExit}
                                            </Alert>
                                        )}
                                    </li>
                                )
                            })}
                        </ul>

                        {/* Vista escritorio */}
                        <TableContainer
                            label="Mis permisos"
                            busy={isFetching}
                            className="hidden md:block"
                        >
                            <table className="w-full min-w-240 table-fixed text-left text-sm">
                                <caption className="sr-only">
                                    Historial de permisos personales: solicitud,
                                    fecha, hora, tipo, motivo y estado
                                </caption>

                                <colgroup>
                                    <col className="w-[10%]" />
                                    <col className="w-[18%]" />
                                    <col className="w-[14%]" />
                                    <col className="w-[30%]" />
                                    <col className="w-[28%]" />
                                </colgroup>

                                <thead className="border-b border-mesa-border bg-mesa-canvas text-mesa-muted">
                                    <tr>
                                        <th
                                            scope="col"
                                            className="px-4 py-3 font-semibold"
                                        >
                                            Solicitud
                                        </th>

                                        <th
                                            scope="col"
                                            className="px-4 py-3 font-semibold"
                                        >
                                            Permiso
                                        </th>

                                        <th
                                            scope="col"
                                            className="px-4 py-3 font-semibold"
                                        >
                                            Fecha y hora
                                        </th>

                                        <th
                                            scope="col"
                                            className="px-4 py-3 font-semibold"
                                        >
                                            Motivo
                                        </th>

                                        <th
                                            scope="col"
                                            className="px-4 py-3 font-semibold"
                                        >
                                            Estado
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-mesa-border">
                                    {data.items.map((permit) => {
                                        const actualExit = formatActualExit(
                                            permit.actualExitAt,
                                        )

                                        return (
                                            <tr
                                                key={permit.id}
                                                className="align-top"
                                            >
                                                <th
                                                    scope="row"
                                                    className="px-4 py-5 font-medium tabular-nums"
                                                >
                                                    #{permit.id}
                                                </th>

                                                <td className="px-4 py-5">
                                                    <p className="font-semibold wrap-anywhere">
                                                        {
                                                            permitTypeLabels[
                                                            permit.permitType
                                                            ]
                                                        }
                                                    </p>
                                                </td>

                                                <td className="px-4 py-5">
                                                    <p className="font-medium tabular-nums whitespace-nowrap">
                                                        {formatPermitDate(
                                                            permit.permitDate,
                                                        )}
                                                    </p>

                                                    <p className="mt-1 text-mesa-muted tabular-nums whitespace-nowrap">
                                                        {permit.exitTime.slice(
                                                            0,
                                                            5,
                                                        )}
                                                    </p>
                                                </td>

                                                <td className="px-4 py-5">
                                                    <p className="leading-relaxed whitespace-pre-wrap wrap-anywhere">
                                                        {permit.reason}
                                                    </p>
                                                </td>

                                                <td className="px-4 py-5">
                                                    <div className="space-y-3">
                                                        <StatusBadge
                                                            label={
                                                                permitStatusLabels[
                                                                permit.status
                                                                ]
                                                            }
                                                            tone={
                                                                permitStatusTones[
                                                                permit.status
                                                                ]
                                                            }
                                                        />

                                                        <p className="leading-relaxed text-mesa-muted">
                                                            {
                                                                permitStatusDescriptions[
                                                                permit.status
                                                                ]
                                                            }
                                                        </p>

                                                        {permit.status === 3 &&
                                                            permit.rejectionReason && (
                                                                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-mesa-error">
                                                                    <p className="font-semibold">
                                                                        Motivo del
                                                                        rechazo
                                                                    </p>

                                                                    <p className="mt-1 leading-relaxed wrap-anywhere">
                                                                        {
                                                                            permit.rejectionReason
                                                                        }
                                                                    </p>
                                                                </div>
                                                            )}

                                                        {permit.status === 5 &&
                                                            actualExit && (
                                                                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                                                                    <p className="font-semibold">
                                                                        Salida
                                                                        registrada
                                                                    </p>

                                                                    <p className="mt-1">
                                                                        {
                                                                            actualExit
                                                                        }
                                                                    </p>
                                                                </div>
                                                            )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </TableContainer>
                    </>
                )}

                <nav
                    aria-label="Paginación de mis permisos"
                    className="mesa-pagination grid grid-cols-2 items-center gap-3 md:grid-cols-[auto_1fr_auto]"
                >
                    <Button
                        type="button"
                        variant="secondary"
                        disabled={!canGoPrevious}
                        onClick={() => {
                            if (canGoPrevious) {
                                setPage((current) =>
                                    Math.max(1, current - 1),
                                )
                            }
                        }}
                        className="row-start-2 md:row-start-1"
                    >
                        Anterior
                    </Button>

                    <p className="col-span-2 col-start-1 row-start-1 text-center text-sm text-mesa-muted md:col-span-1 md:col-start-2">
                        {data && !isError
                            ? data.totalPages === 0
                                ? 'Sin páginas para mostrar'
                                : `Página ${data.page} de ${data.totalPages}`
                            : `Página ${page}`}
                    </p>

                    <Button
                        type="button"
                        variant="secondary"
                        disabled={!canGoNext}
                        onClick={() => {
                            if (canGoNext && data) {
                                setPage((current) =>
                                    Math.min(
                                        data.totalPages,
                                        current + 1,
                                    ),
                                )
                            }
                        }}
                        className="row-start-2 md:col-start-3 md:row-start-1"
                    >
                        Siguiente
                    </Button>
                </nav>
            </section>
        </section>
    )
}