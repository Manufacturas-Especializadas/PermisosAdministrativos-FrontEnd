import { isAxiosError } from 'axios'
import ImportDepartments from '../features/departments/components/ImportDepartments'
import { useRef, useState } from 'react'
import { useCreateDepartment } from '../features/departments/hooks/useCreateDepartment'
import { useDepartments } from '../features/departments/hooks/useDepartments'

const errorClass = 'rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800'

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
    <section aria-labelledby="departments-title" className="space-y-6">
      <div>
        <h1 id="departments-title" className="text-3xl font-semibold tracking-tight text-slate-950">Departamentos</h1>
        <p className="mt-1 text-sm text-slate-600">Administra los departamentos utilizados por los empleados.</p>
      </div>

      <ImportDepartments />

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          void handleSubmit()
        }}
        aria-labelledby="create-department-title"
        aria-busy={createDepartment.isPending}
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 id="create-department-title" className="mb-5 text-lg font-semibold text-slate-900">Crear departamento</h2>
        <fieldset disabled={createDepartment.isPending} className="min-w-0 space-y-5">
          <legend className="sr-only">Datos del departamento</legend>
          <div className="space-y-2">
            <label htmlFor="department-name" className="block text-sm font-medium text-slate-700">Nombre del departamento</label>
            <input
              id="department-name"
              required
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={!!validationError}
              aria-describedby={validationError ? 'department-name-help department-name-error' : 'department-name-help'}
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
            <p id="department-name-help" className="text-sm text-slate-500">Máximo 100 caracteres.</p>
          </div>
          {validationError && <p id="department-name-error" role="alert" className={errorClass}>{validationError}</p>}
          {createDepartment.isError && <p role="alert" className={errorClass}>{getCreationError(createDepartment.error)}</p>}
          {createDepartment.isSuccess && (
            <p role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">Departamento creado correctamente.</p>
          )}
          <div className="flex justify-end border-t border-slate-200 pt-5">
            <button
              type="submit"
              disabled={createDepartment.isPending}
              className="min-h-11 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {createDepartment.isPending ? 'Creando...' : 'Crear departamento'}
            </button>
          </div>
        </fieldset>
      </form>

      <section aria-labelledby="registered-departments-title" className="space-y-4">
        <h2 id="registered-departments-title" className="text-lg font-semibold text-slate-900">Departamentos registrados</h2>
        {departments.isPending && <p role="status" className="text-sm text-slate-600">Cargando departamentos...</p>}
        {departments.isError && (
          <p role="alert" className={errorClass}>
            {sessionExpired ? 'Tu sesión ha expirado. Vuelve a iniciar sesión.' : 'No se pudieron cargar los departamentos. Inténtalo nuevamente.'}
          </p>
        )}
        {!departments.isPending && !sessionExpired && departments.data && (departments.data.length === 0 ? (
          <p role="status" className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">No hay departamentos registrados.</p>
        ) : (
          <div
            role="region"
            aria-label="Listado de departamentos"
            tabIndex={0}
            className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          >
            <table className="w-full min-w-96 text-left text-sm">
              <caption className="sr-only">Nombre y estado de los departamentos registrados</caption>
              <thead className="border-b border-slate-200 bg-slate-100 text-slate-700">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Nombre</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {departments.data.map((department) => (
                  <tr key={department.id}>
                    <th scope="row" className="px-4 py-3 font-medium wrap-anywhere text-slate-900">{department.name}</th>
                    <td className="px-4 py-3 text-slate-600">{department.isActive ? 'Activo' : 'Inactivo'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </section>
    </section>
  )
}
