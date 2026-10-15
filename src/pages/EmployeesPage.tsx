import { isAxiosError } from 'axios'
import { useRef, useState } from 'react'
import Alert from '../components/Alert'
import Button from '../components/Button'
import ConfirmationDialog from '../components/ConfirmationDialog'
import { useToast } from '../components/useToast'
import ImportResult from '../components/ImportResult'
import StatusBadge from '../components/StatusBadge'
import TableContainer from '../components/TableContainer'
import LoadingState from '../components/LoadingState'
import { useEmployees } from '../features/employees/hooks/useEmployees'
import { useDebouncedValue } from '../features/employees/hooks/useDebouncedValue'
import { useImportEmployees } from '../features/employees/hooks/useImportEmployees'

function getImportError(error: unknown): string {
  if (isAxiosError<string | { title?: unknown }>(error)) {
    if (error.response?.status === 401) return 'Tu sesión ha expirado. Vuelve a iniciar sesión.'
    const data = error.response?.data
    const message = typeof data === 'string' ? data : data?.title
    if (error.response?.status === 400 && typeof message === 'string' && message.trim()) {
      return message.trim()
    }
  }
  return 'No se pudo importar el archivo. Inténtalo nuevamente.'
}

export default function EmployeesPage() {
  const [importOpen, setImportOpen] = useState(false)
  const importEmployees = useImportEmployees()
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)
  const importing = useRef(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const notify = useToast()

  function requestImport() {
    if (importing.current) return
    importEmployees.reset()
    const message = !file
      ? 'Selecciona un archivo Excel.'
      : !file.name.toLowerCase().endsWith('.xlsx')
        ? 'Solo se permiten archivos .xlsx.'
        : file.size > 5 * 1024 * 1024
          ? 'El archivo no puede superar los 5 MB.'
          : ''
    setFileError(message)
    if (message || !file) return
    setImportFile(file)
  }

  async function handleImport() {
    if (importing.current || !importFile) return false
    importing.current = true
    try {
      await importEmployees.mutateAsync(importFile)
      setFile(null)
      if (fileInput.current) fileInput.current.value = ''
      notify('Importación de empleados completada. Revisa el resumen de resultados.')
      return true
    } catch {
      // Conserva el archivo para reintentar; la mutation expone el error HTTP.
      return false
    } finally {
      importing.current = false
    }
  }

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

  const sessionExpired = isAxiosError(error) && error.response?.status === 401
  const canGoPrevious = page > 1 && !isFetching
  const canGoNext = !!data && !isError && !isFetching && !isPlaceholderData && page < data.totalPages

  // Si el total cambia en el servidor, vuelve a una página que todavía exista.
  if (
    data &&
    !isPlaceholderData &&
    !isError &&
    page > Math.max(1, data.totalPages)
  ) {
    setPage(Math.max(1, data.totalPages))
  }

  return (
    <section aria-labelledby="employees-title" className="min-w-0 space-y-6 text-mesa-text">
      <header className="mesa-page-header">
        <h1 id="employees-title" className="mesa-page-title">Empleados</h1>
        <p className="text-mesa-muted">Consulta empleados por nombre o número de nómina.</p>
      </header>

      <section aria-label="Búsqueda y estado de empleados" className="mesa-card">
        <div className="grid min-w-0 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(9rem,12rem)_auto] md:items-end">
          <div className="min-w-0 space-y-2">
            <label htmlFor="employee-search" className="block text-sm font-semibold">Buscar empleado</label>
            <input
              id="employee-search"
              type="search"
              value={search}
              aria-describedby="employee-search-help"
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              placeholder="Nombre o número de nómina..."
              className="mesa-input min-w-0"
            />
          </div>
          <div className="min-w-0 space-y-2">
            <label htmlFor="employee-status" className="block text-sm font-semibold">Estado</label>
            <select
              id="employee-status"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(
                  event.target.value as 'all' | 'active' | 'inactive',
                )
                setPage(1)
              }}
              className="mesa-input"
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
          {search && (
            <Button
              variant="secondary"
              onClick={() => {
                setSearch('')
                setPage(1)
              }}
              className="w-full md:w-auto"
            >
              Limpiar búsqueda
            </Button>
          )}
        </div>
        <p id="employee-search-help" className="mt-3 text-sm text-mesa-muted">Escribe un nombre o número de nómina. Los resultados se actualizan mientras buscas.</p>
      </section>

      <div className="min-w-0 space-y-4">
        <Button
          variant="secondary"
          aria-expanded={importOpen}
          aria-controls="employee-import-panel"
          onClick={() => setImportOpen((open) => !open)}
          className="w-full md:w-auto"
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
            <path d={importOpen ? 'm6 15 6-6 6 6' : 'm6 9 6 6 6-6'} />
          </svg>
          Importar empleados
        </Button>
        <section id="employee-import-panel" hidden={!importOpen} aria-labelledby="import-employees-title" className="mesa-card space-y-4">
          <div>
            <h2 id="import-employees-title" className="text-lg font-semibold">Importación desde Excel</h2>
            <p className="mt-1 text-sm text-mesa-muted">Importa empleados desde un archivo Excel.</p>
          </div>
          <form onSubmit={(event) => { event.preventDefault(); requestImport() }} aria-busy={importEmployees.isPending}>
            <fieldset disabled={importEmployees.isPending} className="min-w-0 space-y-4">
              <legend className="sr-only">Archivo de empleados</legend>
              <div className="min-w-0 space-y-2">
                <label htmlFor="employee-import-file" className="block text-sm font-semibold">Archivo Excel</label>
                <input
                  ref={fileInput}
                  id="employee-import-file"
                  type="file"
                  accept=".xlsx"
                  disabled={importEmployees.isPending}
                  aria-invalid={!!fileError}
                  aria-describedby={`employee-import-help${fileError ? ' employee-import-error' : ''}`}
                  onChange={(event) => {
                    setFile(event.target.files?.[0] ?? null)
                    setFileError('')
                    importEmployees.reset()
                  }}
                  className="mesa-input min-w-0 max-w-full file:mr-3 file:rounded-md file:border-0 file:bg-mesa-canvas file:px-3 file:py-2 file:text-sm file:font-medium file:text-mesa-text"
                />
                <p id="employee-import-help" className="text-sm wrap-anywhere text-mesa-muted">Archivo .xlsx de hasta 5 MB. Columnas obligatorias: NumeroNomina, NombreCompleto y Departamento.</p>
                {file && <p className="text-sm wrap-anywhere text-mesa-muted">Archivo seleccionado: {file.name}</p>}
              </div>
              <Button type="submit" disabled={!file || importEmployees.isPending} loading={importEmployees.isPending} loadingText="Importando..." className="w-full md:w-auto">
                Importar empleados
              </Button>
            </fieldset>
          </form>
          <p role="status" className={importEmployees.isPending ? 'text-sm text-mesa-muted' : 'sr-only'}>
            {importEmployees.isPending ? 'Importando empleados. Espera a que termine el proceso.' : ''}
          </p>
          {fileError && <Alert id="employee-import-error">{fileError}</Alert>}
          {importEmployees.isError && <Alert>{getImportError(importEmployees.error)}</Alert>}
          {importEmployees.isSuccess && <ImportResult {...importEmployees.data} />}
        </section>
      </div>

      <section aria-labelledby="employees-results-title" className="min-w-0 space-y-4">
        <div className="space-y-1">
          <h2 id="employees-results-title" className="text-lg font-semibold">Resultados</h2>
          <div className="min-h-6 text-sm text-mesa-muted" role="status" aria-live="polite">
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
        </div>

        {isPending ? (
          <LoadingState>
            Preparando el listado de empleados...
          </LoadingState>
        ) : isError ? (
          <Alert>
            {sessionExpired
              ? 'Tu sesión ha expirado. Vuelve a iniciar sesión para consultar los empleados.'
              : 'No se pudieron cargar los empleados. Inténtalo de nuevo más tarde.'}
          </Alert>
        ) : data.items.length === 0 ? (
          <div role="status" className="mesa-empty-state space-y-2">
            <p className="font-semibold">
              {debouncedSearch.trim()
                ? statusFilter !== 'all'
                  ? 'No encontramos empleados que coincidan con la búsqueda y el estado seleccionado.'
                  : 'No encontramos empleados con esa búsqueda.'
                : statusFilter !== 'all'
                  ? `No hay empleados ${statusFilter === 'active' ? 'activos' : 'inactivos'} para mostrar.`
                  : 'No hay empleados para mostrar.'}
            </p>
            {(debouncedSearch.trim() || statusFilter !== 'all') && (
              <p className="text-sm text-mesa-muted">
                {debouncedSearch.trim()
                  ? statusFilter !== 'all'
                    ? 'Prueba con otro nombre o número de nómina, o revisa el estado seleccionado.'
                    : 'Prueba con otro nombre o número de nómina.'
                  : 'Selecciona otro estado para consultar los empleados.'}
              </p>
            )}
          </div>
        ) : (
          <>
            <ul aria-label="Listado de empleados" aria-busy={isFetching} className="min-w-0 space-y-3 md:hidden">
              {data.items.map((employee) => (
                <li key={employee.id} className="min-w-0 space-y-4 rounded-xl border border-mesa-border bg-white p-4">
                  <div className="space-y-2">
                    <h3 className="text-lg leading-snug font-semibold wrap-anywhere">{employee.fullName}</h3>
                    <dl className="space-y-2 text-sm">
                      <div>
                        <dt className="font-medium text-mesa-muted">Nómina</dt>
                        <dd className="mt-0.5 tabular-nums wrap-anywhere">{employee.payrollNumber}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-mesa-muted">Departamento</dt>
                        <dd className="mt-0.5 wrap-anywhere">{employee.departmentName}</dd>
                      </div>
                    </dl>
                  </div>
                  <StatusBadge isActive={employee.isActive} />
                </li>
              ))}
            </ul>
            <TableContainer label="Listado de empleados" busy={isFetching} className="hidden md:block">
              <table className="w-full min-w-150 table-fixed text-left text-sm">
                <caption className="sr-only">Empleados: nombre, número de nómina, departamento y estado</caption>
                <thead className="border-b border-mesa-border bg-mesa-canvas text-mesa-muted">
                  <tr>
                    <th scope="col" className="w-[32%] px-4 py-3 font-semibold">Empleado</th>
                    <th scope="col" className="w-[18%] px-4 py-3 font-semibold">Nómina</th>
                    <th scope="col" className="w-[30%] px-4 py-3 font-semibold">Departamento</th>
                    <th scope="col" className="w-[20%] px-4 py-3 font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mesa-border">
                  {data.items.map((employee) => (
                    <tr key={employee.id} className="align-top">
                      <th scope="row" className="px-4 py-4 font-semibold wrap-anywhere">{employee.fullName}</th>
                      <td className="px-4 py-4 tabular-nums wrap-anywhere text-mesa-muted">{employee.payrollNumber}</td>
                      <td className="px-4 py-4 wrap-anywhere text-mesa-muted">{employee.departmentName}</td>
                      <td className="px-4 py-4"><StatusBadge isActive={employee.isActive} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableContainer>
          </>
        )}

        <nav aria-label="Paginación de empleados" className="mesa-pagination grid grid-cols-2 items-center gap-3 md:grid-cols-[auto_1fr_auto]">
          <Button
            variant="secondary"
            disabled={!canGoPrevious}
            onClick={() => {
              if (canGoPrevious) setPage((currentPage) => Math.max(1, currentPage - 1))
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
              if (canGoNext && data) setPage((currentPage) => Math.min(data.totalPages, currentPage + 1))
            }}
            className="row-start-2 md:col-start-3 md:row-start-1"
          >
            Siguiente
          </Button>
        </nav>
      </section>
      {importFile && (
        <ConfirmationDialog
          title="¿Importar empleados?"
          description={<>Se procesará el archivo <strong>{importFile.name}</strong> para importar empleados. Revisa que sea el archivo correcto antes de continuar.</>}
          confirmText="Importar empleados"
          loadingText="Importando..."
          onCancel={() => setImportFile(null)}
          onConfirm={handleImport}
        >
          {importEmployees.isError && <Alert>{getImportError(importEmployees.error)}</Alert>}
        </ConfirmationDialog>
      )}
    </section>
  )
}
