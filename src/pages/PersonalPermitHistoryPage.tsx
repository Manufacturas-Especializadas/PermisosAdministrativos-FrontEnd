import { isAxiosError } from 'axios'
import { useState } from 'react'
import type { GetPersonalPermitsParams } from '../api/personalPermitsApi'
import { usePersonalPermitHistory } from '../features/personalPermits/hooks/usePersonalPermitHistory'
import { formatPermitDate, permitStatusLabels, permitTypeLabels } from '../features/personalPermits/personalPermit.format'
import type { PersonalPermitStatus } from '../features/personalPermits/personalPermit.types'

type HistoryFilters = Pick<GetPersonalPermitsParams, 'status' | 'fromDate' | 'toDate'>

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
    <section aria-labelledby="permit-history-title" className="space-y-6">
      <div>
        <h1 id="permit-history-title" className="text-3xl font-semibold tracking-tight text-slate-950">
          Historial de permisos
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Consulta los permisos registrados y su estado.
        </p>
      </div>

      <form
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        onSubmit={(event) => {
          event.preventDefault()
          applyFilters({
            status: status === '' ? undefined : status,
            fromDate: fromDate || undefined,
            toDate: toDate || undefined,
          })
        }}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <label htmlFor="history-status" className="block text-sm font-medium text-slate-700">
              Estado
            </label>
            <select
              id="history-status"
              value={status}
              onChange={(event) => setStatus(
                event.target.value === '' ? '' : Number(event.target.value) as PersonalPermitStatus,
              )}
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Todos</option>
              {Object.entries(permitStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="history-from-date" className="block text-sm font-medium text-slate-700">
              Fecha desde
            </label>
            <input
              id="history-from-date"
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(event) => setFromDate(event.target.value)}
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="history-to-date" className="block text-sm font-medium text-slate-700">
              Fecha hasta
            </label>
            <input
              id="history-to-date"
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(event) => setToDate(event.target.value)}
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="min-h-11 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          >
            Buscar
          </button>
          <button
            type="button"
            onClick={() => {
              setStatus('')
              setFromDate('')
              setToDate('')
              applyFilters({})
            }}
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          >
            Limpiar filtros
          </button>
        </div>
      </form>

      <div className="min-h-6 space-y-1 text-sm text-slate-600" role="status" aria-live="polite">
        {isPending ? (
          <p>Cargando historial...</p>
        ) : isFetching || isPlaceholderData ? (
          <p>Actualizando historial...</p>
        ) : null}
        {data && !isError && !isPlaceholderData && (
          <p>Mostrando {data.items.length} de {data.totalCount} permisos.</p>
        )}
      </div>

      {isPending ? (
        <div className="min-h-40 rounded-xl border border-slate-200 bg-white" aria-busy="true" />
      ) : isError ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {sessionExpired
            ? 'Tu sesión ha expirado. Vuelve a iniciar sesión para consultar el historial.'
            : 'No se pudo cargar el historial de permisos. Inténtalo nuevamente.'}
        </p>
      ) : data.items.length === 0 ? (
        <p role="status" className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
          No se encontraron permisos con los filtros seleccionados.
        </p>
      ) : (
        <div
          className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          role="region"
          aria-label="Historial de permisos"
          aria-busy={isFetching}
          tabIndex={0}
        >
          <table className="w-full min-w-220 text-left text-sm">
            <caption className="sr-only">
              Historial de permisos: empleado, nómina, fecha, hora, tipo, motivo y estado
            </caption>
            <thead className="border-b border-slate-200 bg-slate-100 text-slate-700">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Empleado</th>
                <th scope="col" className="px-4 py-3 font-semibold">Nómina</th>
                <th scope="col" className="px-4 py-3 font-semibold">Fecha</th>
                <th scope="col" className="px-4 py-3 font-semibold">Hora</th>
                <th scope="col" className="px-4 py-3 font-semibold">Tipo</th>
                <th scope="col" className="px-4 py-3 font-semibold">Motivo</th>
                <th scope="col" className="px-4 py-3 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.items.map((permit) => (
                <tr key={permit.id}>
                  <th scope="row" className="px-4 py-3 font-medium wrap-anywhere text-slate-900">
                    {permit.employeeName}
                  </th>
                  <td className="px-4 py-3 wrap-anywhere text-slate-600">{permit.payrollNumber}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                    {formatPermitDate(permit.permitDate)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                    {permit.exitTime.slice(0, 5)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{permitTypeLabels[permit.permitType]}</td>
                  <td className="px-4 py-3 whitespace-pre-wrap wrap-anywhere text-slate-600">{permit.reason}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600">{permitStatusLabels[permit.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <nav aria-label="Paginación del historial de permisos" className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          disabled={!canGoPrevious}
          onClick={() => {
            if (canGoPrevious) setPage((current) => Math.max(1, current - 1))
          }}
          className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          Anterior
        </button>
        <p className="text-sm text-slate-600">
          {data && !isError
            ? `Página ${data.totalPages === 0 ? 0 : data.page} de ${data.totalPages}`
            : `Página ${page}`}
        </p>
        <button
          type="button"
          disabled={!canGoNext}
          onClick={() => {
            if (canGoNext && data) setPage((current) => Math.min(data.totalPages, current + 1))
          }}
          className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          Siguiente
        </button>
      </nav>
    </section>
  )
}
