import { isAxiosError } from 'axios'
import { useState, useEffect } from 'react'
import { useEmployees } from '../features/employees/hooks/useEmployees'
import { useDebouncedValue } from '../features/employees/hooks/useDebouncedValue'

export default function EmployeesPage() {
  const [page, setPage] = useState(1)
  const pageSize = 25

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 350)

  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive'
  >('all')

  const isActive =
    statusFilter === 'all'
      ? null
      : statusFilter === 'active'

  const {
    data,
    isPending,
    isError,
    error,
    isFetching,
    isPlaceholderData,
  } = useEmployees(
    page,
    pageSize,
    debouncedSearch,
    isActive,
  )

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  const sessionExpired = isAxiosError(error) && error.response?.status === 401
  const canGoPrevious = page > 1 && !isFetching
  const canGoNext = !!data && !isError && !isFetching && !isPlaceholderData && page < data.totalPages

  // Si el total cambia en el servidor, vuelve a una página que todavía exista.
  useEffect(() => {
    if (
      data &&
      !isPlaceholderData &&
      !isError &&
      page > Math.max(1, data.totalPages)
    ) {
      setPage(Math.max(1, data.totalPages))
    }
  }, [data, isPlaceholderData, isError, page])

  return (
    <section aria-labelledby="employees-title" className="space-y-6">
      <h1 id="employees-title" className="text-3xl font-semibold tracking-tight text-slate-950">
        Empleados
      </h1>

      <div className="space-y-2">
        <label
          htmlFor="employee-search"
          className="block text-sm font-medium text-slate-700"
        >
          Buscar empleado
        </label>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="employee-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nombre o número de nómina..."
            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 sm:max-w-md"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="employee-status"
          className="block text-sm font-medium text-slate-700"
        >
          Estado
        </label>

        <select
          id="employee-status"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value as 'all' | 'active' | 'inactive',
            )
          }
          className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 sm:max-w-xs"
        >
          <option value="all">Todos</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
      </div>

      <div className="min-h-6 text-sm text-slate-600" role="status" aria-live="polite">
        {isFetching
          ? debouncedSearch.trim()
            ? 'Buscando empleados...'
            : `Cargando empleados de la página ${page}...`
          : isPending
            ? 'Esperando conexión para cargar empleados...'
            : data && !isError
              ? `Mostrando ${data.items.length} de ${data.totalCount} empleados.`
              : null}
      </div>

      {isPending ? (
        <div className="min-h-40 rounded-xl border border-slate-200 bg-white" aria-busy="true" />
      ) : isError ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {sessionExpired
            ? 'Tu sesión ha expirado. Vuelve a iniciar sesión para consultar los empleados.'
            : 'No se pudieron cargar los empleados. Inténtalo de nuevo más tarde.'}
        </p>
      ) : data.items.length === 0 ? (
        <p
          role="status"
          className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600"
        >
          {debouncedSearch.trim()
            ? 'No se encontraron empleados para esa búsqueda.'
            : 'No hay empleados para mostrar.'}
        </p>
      ) : (
        <div className="space-y-3">
          <div
            className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            role="region"
            aria-label="Listado de empleados"
            aria-busy={isFetching}
            tabIndex={0}
          >
            <table className="w-full min-w-150 text-left text-sm">
              <caption className="sr-only">Empleados: número de nómina, nombre, departamento y estado</caption>
              <thead className="border-b border-slate-200 bg-slate-100 text-slate-700">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Número de nómina</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Nombre</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Departamento</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.items.map((employee) => (
                  <tr key={employee.id}>
                    <td className="px-4 py-3 wrap-anywhere text-slate-600">{employee.payrollNumber}</td>
                    <th scope="row" className="px-4 py-3 font-medium wrap-anywhere text-slate-900">{employee.fullName}</th>
                    <td className="px-4 py-3 wrap-anywhere text-slate-600">{employee.departmentName}</td>
                    <td className="px-4 py-3 text-slate-600">{employee.isActive ? 'Activo' : 'Inactivo'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <nav aria-label="Paginación de empleados" className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          disabled={!canGoPrevious}
          onClick={() => {
            if (canGoPrevious) setPage((currentPage) => Math.max(1, currentPage - 1))
          }}
          className="min-h-11 cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
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
            if (canGoNext && data) setPage((currentPage) => Math.min(data.totalPages, currentPage + 1))
          }}
          className="min-h-11 cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          Siguiente
        </button>
      </nav>
    </section>
  )
}
