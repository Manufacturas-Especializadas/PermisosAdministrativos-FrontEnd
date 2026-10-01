import { isAxiosError } from 'axios'
import { useState } from 'react'
import { useEmployees } from '../features/employees/hooks/useEmployees'

export default function EmployeesPage() {
  const [page, setPage] = useState(1)
  const pageSize = 25
  const { data, isPending, isError, error, isFetching, isPlaceholderData } = useEmployees(page, pageSize)
  const sessionExpired = isAxiosError(error) && error.response?.status === 401
  const canGoPrevious = page > 1 && !isFetching
  const canGoNext = !!data && !isError && !isFetching && !isPlaceholderData && page < data.totalPages

  // Si el total cambia en el servidor, vuelve a una página que todavía exista.
  if (data && !isPlaceholderData && !isError && page > Math.max(1, data.totalPages)) {
    setPage(Math.max(1, data.totalPages))
  }

  return (
    <section aria-labelledby="employees-title" className="space-y-6">
      <h1 id="employees-title" className="text-3xl font-semibold tracking-tight text-slate-950">
        Empleados
      </h1>

      <div className="min-h-6 text-sm text-slate-600" role="status" aria-live="polite">
        {isFetching
          ? `Cargando empleados de la página ${page}...`
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
        <p role="status" className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
          No hay empleados para mostrar.
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
            <table className="w-full min-w-[600px] text-left text-sm">
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
