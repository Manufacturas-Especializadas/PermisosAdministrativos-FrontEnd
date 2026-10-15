import { isAxiosError } from 'axios'
import Alert from '../components/Alert'
import Button from '../components/Button'
import StatusBadge from '../components/StatusBadge'
import TableContainer from '../components/TableContainer'
import LoadingState from '../components/LoadingState'
import EmptyState from '../components/EmptyState'
import ImportDepartments from '../features/departments/components/ImportDepartments'
import { useRef, useState } from 'react'
import { useCreateDepartment } from '../features/departments/hooks/useCreateDepartment'
import { useDepartments } from '../features/departments/hooks/useDepartments'

function getCreationError(error: unknown): string {
  if (isAxiosError<{ detail?: unknown; title?: unknown }>(error)) {
    if (error.response?.status === 409) return 'Ya existe un departamento con ese nombre.'
    if (error.response?.status === 400) {
      for (const message of [error.response.data?.detail, error.response.data?.title]) {
        if (typeof message === 'string' && message.trim()) return message.trim()
      }
    }
  }
  return 'No se pudo crear el departamento. Inténtalo nuevamente.'
}

export default function DepartmentsPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const departments = useDepartments()
  const createDepartment = useCreateDepartment()
  const [name, setName] = useState('')
  const [validationError, setValidationError] = useState('')
  const creating = useRef(false)
  const sessionExpired = isAxiosError(departments.error) && departments.error.response?.status === 401

  async function handleSubmit() {
    if (creating.current) return
    createDepartment.reset()
    const trimmedName = name.trim()
    const message = !trimmedName
      ? 'Ingresa el nombre del departamento.'
      : trimmedName.length > 100
        ? 'El nombre del departamento no debe superar los 100 caracteres.'
        : ''
    setValidationError(message)
    if (message) return

    creating.current = true
    try {
      await createDepartment.mutateAsync({ name: trimmedName })
      setName('')
    } catch {
      // La mutation expone el error y el nombre se conserva para reintentar.
    } finally {
      creating.current = false
    }
  }

  return (
    <section aria-labelledby="departments-title" className="min-w-0 space-y-6 text-mesa-text">
      <header className="mesa-page-header">
        <h1 id="departments-title" className="mesa-page-title">Departamentos</h1>
        <p className="text-mesa-muted">Administra los departamentos utilizados por los empleados.</p>
      </header>

      <div className="flex min-w-0 flex-col gap-3 md:flex-row md:flex-wrap">
        <Button
          aria-expanded={createOpen}
          aria-controls="create-department-panel"
          onClick={() => setCreateOpen((open) => !open)}
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
            <path d={createOpen ? 'm6 15 6-6 6 6' : 'M12 5v14M5 12h14'} />
          </svg>
          Crear departamento
        </Button>
        <Button
          variant="secondary"
          aria-expanded={importOpen}
          aria-controls="import-departments-panel"
          onClick={() => setImportOpen((open) => !open)}
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
            <path d={importOpen ? 'm6 15 6-6 6 6' : 'm6 9 6 6 6-6'} />
          </svg>
          Importar departamentos
        </Button>
      </div>

      <form
        id="create-department-panel"
        hidden={!createOpen}
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          void handleSubmit()
        }}
        aria-labelledby="create-department-title"
        aria-busy={createDepartment.isPending}
        className="mesa-card space-y-4"
      >
        <h2 id="create-department-title" className="text-lg font-semibold">Crear departamento</h2>
        <fieldset disabled={createDepartment.isPending} className="min-w-0 space-y-4">
          <legend className="sr-only">Datos del departamento</legend>
          <div className="min-w-0 space-y-2 md:max-w-xl">
            <label htmlFor="department-name" className="block text-sm font-medium">Nombre del departamento</label>
            <input
              id="department-name"
              required
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={!!validationError}
              aria-describedby={validationError ? 'department-name-help department-name-error' : 'department-name-help'}
              className="mesa-input min-w-0"
            />
            <p id="department-name-help" className="text-sm text-mesa-muted">Máximo 100 caracteres.</p>
          </div>
          {validationError && <Alert id="department-name-error">{validationError}</Alert>}
          {createDepartment.isError && <Alert>{getCreationError(createDepartment.error)}</Alert>}
          {createDepartment.isSuccess && <Alert variant="success">Departamento creado correctamente.</Alert>}
          <div className="border-t border-mesa-border pt-4">
            <Button type="submit" disabled={createDepartment.isPending} loading={createDepartment.isPending} className="w-full md:w-auto">
              {createDepartment.isPending ? 'Creando...' : 'Crear departamento'}
            </Button>
          </div>
        </fieldset>
        <p role="status" className="sr-only">{createDepartment.isPending ? 'Creando departamento...' : ''}</p>
      </form>

      <div id="import-departments-panel" hidden={!importOpen}>
        <ImportDepartments />
      </div>

      <section aria-labelledby="registered-departments-title" className="min-w-0 space-y-4">
        <div className="space-y-1">
          <h2 id="registered-departments-title" className="text-lg font-semibold">Departamentos registrados</h2>
          <p role="status" className="text-sm text-mesa-muted">
            {!departments.isPending && departments.isFetching ? 'Actualizando departamentos...' : ''}
          </p>
        </div>
        {departments.isPending && <LoadingState>Cargando departamentos...</LoadingState>}
        {departments.isError && (
          <Alert>
            <p>{sessionExpired ? 'Tu sesión ha expirado. Vuelve a iniciar sesión.' : 'No se pudieron cargar los departamentos. Inténtalo nuevamente.'}</p>
            {!sessionExpired && !!departments.data?.length && <p className="mt-2">Los datos mostrados corresponden a la última consulta correcta y existe un problema actualizando la información.</p>}
          </Alert>
        )}
        {!departments.isPending && !sessionExpired && departments.data && (departments.data.length === 0 ? (
          <EmptyState>No hay departamentos registrados.</EmptyState>
        ) : (
          <>
            <ul aria-label="Listado de departamentos" aria-busy={departments.isFetching} className="min-w-0 space-y-3 md:hidden">
              {departments.data.map((department) => (
                <li key={department.id} className="min-w-0 space-y-3 rounded-xl border border-mesa-border bg-white p-4">
                  <h3 className="text-lg leading-snug font-semibold wrap-anywhere">{department.name}</h3>
                  <StatusBadge isActive={department.isActive} />
                </li>
              ))}
            </ul>
            <TableContainer label="Listado de departamentos" busy={departments.isFetching} className="hidden md:block">
              <table className="w-full min-w-96 table-fixed text-left text-sm">
                <caption className="sr-only">Nombre y estado de los departamentos registrados</caption>
                <thead className="border-b border-mesa-border bg-mesa-canvas text-mesa-muted">
                  <tr>
                    <th scope="col" className="w-[70%] px-4 py-3 font-semibold">Departamento</th>
                    <th scope="col" className="w-[30%] px-4 py-3 font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mesa-border">
                  {departments.data.map((department) => (
                    <tr key={department.id} className="align-top">
                      <th scope="row" className="px-4 py-4 font-semibold wrap-anywhere">{department.name}</th>
                      <td className="px-4 py-4"><StatusBadge isActive={department.isActive} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableContainer>
          </>
        ))}
      </section>
    </section>
  )
}
