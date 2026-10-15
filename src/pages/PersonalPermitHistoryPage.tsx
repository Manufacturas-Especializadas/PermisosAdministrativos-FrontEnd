import { isAxiosError } from 'axios'
import { useState } from 'react'
import Alert from '../components/Alert'
import Button from '../components/Button'
import StatusBadge from '../components/StatusBadge'
import TableContainer from '../components/TableContainer'
import LoadingState from '../components/LoadingState'
import EmptyState from '../components/EmptyState'
import type { GetPersonalPermitsParams } from '../api/personalPermitsApi'
import { usePersonalPermitHistory } from '../features/personalPermits/hooks/usePersonalPermitHistory'
import { formatPermitDate, permitStatusLabels, permitTypeLabels } from '../features/personalPermits/personalPermit.format'
import type { PersonalPermitStatus } from '../features/personalPermits/personalPermit.types'

type HistoryFilters = Pick<GetPersonalPermitsParams, 'status' | 'fromDate' | 'toDate'>

const permitStatusTones = {
  1: 'warning',
  2: 'info',
  3: 'error',
  4: 'neutral',
  5: 'success',
} as const

export default function PersonalPermitHistoryPage() {
  const [status, setStatus] = useState<PersonalPermitStatus | ''>('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [appliedFilters, setAppliedFilters] = useState<HistoryFilters>({})
  const [page, setPage] = useState(1)
  const pageSize = 25

  const { data, isPending, isFetching, isPlaceholderData, isError, error, refetch } =
    usePersonalPermitHistory({ ...appliedFilters, page, pageSize })

  const sessionExpired = isAxiosError(error) && error.response?.status === 401
  const canGoPrevious = page > 1 && !isFetching && !isPlaceholderData
  const canGoNext = !!data && !isError && !isFetching && !isPlaceholderData && page < data.totalPages

  // Conserva una página válida si el total cambia en el servidor.
  if (data && !isError && !isFetching && !isPlaceholderData && page > Math.max(1, data.totalPages)) {
    setPage(Math.max(1, data.totalPages))
  }

  function applyFilters(next: HistoryFilters) {
    // Buscar y limpiar también actualizan una consulta cuyos parámetros no cambiaron.
    if (
      page === 1 &&
      next.status === appliedFilters.status &&
      next.fromDate === appliedFilters.fromDate &&
      next.toDate === appliedFilters.toDate
    ) {
      void refetch()
    }

    setAppliedFilters(next)
    setPage(1)
  }

  return (
    <section aria-labelledby="permit-history-title" className="min-w-0 space-y-6 text-mesa-text">
      <header className="mesa-page-header">
        <h1 id="permit-history-title" className="mesa-page-title">
          Historial de permisos
        </h1>
        <p className="text-mesa-muted">
          Consulta los permisos registrados, incluidos los pendientes, y su estado.
        </p>
      </header>

      <form
        aria-label="Filtros del historial"
        aria-describedby="history-filters-help"
        className="mesa-card space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          applyFilters({
            status: status === '' ? undefined : status,
            fromDate: fromDate || undefined,
            toDate: toDate || undefined,
          })
        }}
      >
        <div className="grid min-w-0 gap-4 md:grid-cols-3">
          <div className="min-w-0 space-y-2">
            <label htmlFor="history-status" className="block text-sm font-semibold">
              Estado
            </label>
            <select
              id="history-status"
              value={status}
              onChange={(event) => setStatus(
                event.target.value === '' ? '' : Number(event.target.value) as PersonalPermitStatus,
              )}
              className="mesa-input min-w-0"
            >
              <option value="">Todos</option>
              {Object.entries(permitStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="min-w-0 space-y-2">
            <label htmlFor="history-from-date" className="block text-sm font-semibold">
              Fecha desde
            </label>
            <input
              id="history-from-date"
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(event) => setFromDate(event.target.value)}
              className="mesa-input min-w-0 max-w-full"
            />
          </div>
          <div className="min-w-0 space-y-2">
            <label htmlFor="history-to-date" className="block text-sm font-semibold">
              Fecha hasta
            </label>
            <input
              id="history-to-date"
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(event) => setToDate(event.target.value)}
              className="mesa-input min-w-0 max-w-full"
            />
          </div>
        </div>
        <p id="history-filters-help" className="text-sm text-mesa-muted">
          Selecciona los filtros y pulsa Buscar para actualizar los resultados.
        </p>
        <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
          <Button type="submit">Buscar</Button>
          <Button
            variant="secondary"
            onClick={() => {
              setStatus('')
              setFromDate('')
              setToDate('')
              applyFilters({})
            }}
          >
            Limpiar filtros
          </Button>
        </div>
      </form>

      <section aria-labelledby="history-results-title" className="min-w-0 space-y-4">
        <div className="space-y-1">
          <h2 id="history-results-title" className="text-lg font-semibold">Resultados</h2>
          <div className="min-h-6 space-y-1 text-sm text-mesa-muted" role="status" aria-live="polite">
            {isPending ? (
              <p>Cargando historial...</p>
            ) : isFetching || isPlaceholderData ? (
              <p>
                Actualizando historial...
                {isPlaceholderData && ' Los resultados anteriores se muestran mientras termina la consulta.'}
              </p>
            ) : null}
            {data && !isError && !isPlaceholderData && (
              <p>Mostrando {data.items.length} de {data.totalCount} permisos.</p>
            )}
          </div>
        </div>

        {isPending ? (
          <LoadingState>
            Preparando el listado de permisos...
          </LoadingState>
        ) : isError ? (
          <Alert>
            {sessionExpired
              ? 'Tu sesión ha expirado. Vuelve a iniciar sesión para consultar el historial.'
              : 'No se pudo cargar el historial de permisos. Inténtalo nuevamente.'}
          </Alert>
        ) : data.items.length === 0 ? (
          <EmptyState>
            {isPlaceholderData
              ? 'Actualizando resultados...'
              : appliedFilters.status !== undefined || appliedFilters.fromDate || appliedFilters.toDate
                ? 'No encontramos permisos con los filtros aplicados.'
                : 'No hay permisos para mostrar.'}
          </EmptyState>
        ) : (
          <>
            <ul aria-label="Historial de permisos" aria-busy={isFetching} className="min-w-0 space-y-3 md:hidden">
              {data.items.map((permit) => (
                <li key={permit.id} className="min-w-0 space-y-4 rounded-xl border border-mesa-border bg-white p-4">
                  <div className="space-y-2">
                    <h3 className="text-lg leading-snug font-semibold wrap-anywhere">{permit.employeeName}</h3>
                    <p className="text-sm tabular-nums wrap-anywhere text-mesa-muted">Nómina: {permit.payrollNumber}</p>
                    <StatusBadge label={permitStatusLabels[permit.status]} tone={permitStatusTones[permit.status]} />
                  </div>
                  <dl className="grid min-w-0 grid-cols-2 gap-3 text-sm">
                    <div className="min-w-0">
                      <dt className="font-medium text-mesa-muted">Fecha</dt>
                      <dd className="mt-1 tabular-nums">{formatPermitDate(permit.permitDate)}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="font-medium text-mesa-muted">Hora</dt>
                      <dd className="mt-1 tabular-nums">{permit.exitTime.slice(0, 5)}</dd>
                    </div>
                    <div className="col-span-2 min-w-0">
                      <dt className="font-medium text-mesa-muted">Tipo</dt>
                      <dd className="mt-1 wrap-anywhere">{permitTypeLabels[permit.permitType]}</dd>
                    </div>
                    <div className="col-span-2 min-w-0 border-t border-mesa-border pt-3">
                      <dt className="font-medium text-mesa-muted">Motivo</dt>
                      <dd className="mt-1 leading-relaxed whitespace-pre-wrap wrap-anywhere">{permit.reason}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
            <TableContainer label="Historial de permisos" busy={isFetching} className="hidden md:block">
              <table className="w-full min-w-220 table-fixed text-left text-sm">
                <caption className="sr-only">
                  Historial de permisos: empleado, nómina, fecha, hora, tipo, motivo y estado
                </caption>
                <thead className="border-b border-mesa-border bg-mesa-canvas text-mesa-muted">
                  <tr>
                    <th scope="col" className="w-[25%] px-4 py-3 font-semibold">Empleado</th>
                    <th scope="col" className="w-[22%] px-4 py-3 font-semibold">Permiso</th>
                    <th scope="col" className="w-[33%] px-4 py-3 font-semibold">Motivo</th>
                    <th scope="col" className="w-[20%] px-4 py-3 font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mesa-border">
                  {data.items.map((permit) => (
                    <tr key={permit.id} className="align-top">
                      <th scope="row" className="px-4 py-4 wrap-anywhere">
                        <p className="font-semibold">{permit.employeeName}</p>
                        <p className="mt-2 font-normal tabular-nums text-mesa-muted">Nómina: {permit.payrollNumber}</p>
                      </th>
                      <td className="px-4 py-4">
                        <dl className="space-y-2">
                          <div>
                            <dt className="text-mesa-muted">Fecha</dt>
                            <dd className="tabular-nums whitespace-nowrap">{formatPermitDate(permit.permitDate)}</dd>
                          </div>
                          <div>
                            <dt className="text-mesa-muted">Hora</dt>
                            <dd className="tabular-nums whitespace-nowrap">{permit.exitTime.slice(0, 5)}</dd>
                          </div>
                          <div>
                            <dt className="text-mesa-muted">Tipo</dt>
                            <dd className="wrap-anywhere">{permitTypeLabels[permit.permitType]}</dd>
                          </div>
                        </dl>
                      </td>
                      <td className="px-4 py-4 leading-relaxed whitespace-pre-wrap wrap-anywhere">
                        <p className="max-w-prose">{permit.reason}</p>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge label={permitStatusLabels[permit.status]} tone={permitStatusTones[permit.status]} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableContainer>
          </>
        )}

        <nav aria-label="Paginación del historial de permisos" className="mesa-pagination grid grid-cols-2 items-center gap-3 md:grid-cols-[auto_1fr_auto]">
          <Button
            variant="secondary"
            disabled={!canGoPrevious}
            onClick={() => {
              if (canGoPrevious) setPage((current) => Math.max(1, current - 1))
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
            variant="secondary"
            disabled={!canGoNext}
            onClick={() => {
              if (canGoNext && data) setPage((current) => Math.min(data.totalPages, current + 1))
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
