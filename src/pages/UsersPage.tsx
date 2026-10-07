import { isAxiosError } from 'axios'
import { useRef, useState } from 'react'
import { EmployeeSelector } from '../features/employees/components/EmployeeSelector'
import type { Employee } from '../features/employees/employees.types'
import { useCreateUser } from '../features/users/hooks/useCreateUser'
import { useSetUserStatus } from '../features/users/hooks/useSetUserStatus'
import { useUsers } from '../features/users/hooks/useUsers'
import type { User } from '../features/users/users.types'

const roles = ['Administrator', 'Supervisor', 'HumanResources', 'Security']
const inputClass = 'min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
const buttonClass = 'min-h-11 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300'
const errorClass = 'rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800'

function getCreationError(error: unknown): string {
  if (isAxiosError<{ detail?: unknown; title?: unknown }>(error) && error.response?.status === 400) {
    for (const message of [error.response.data?.detail, error.response.data?.title]) {
      if (typeof message === 'string' && message.trim()) return message.trim()
    }
  }
  return 'No se pudo crear el usuario. Revisa los datos e inténtalo nuevamente.'
}

export default function UsersPage() {
  const users = useUsers()
  const createUser = useCreateUser()
  const setUserStatus = useSetUserStatus()
  const [userName, setUserName] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('')
  const [associateEmployee, setAssociateEmployee] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [processing, setProcessing] = useState<Partial<Record<string, boolean>>>({})
  const [statusErrors, setStatusErrors] = useState<Partial<Record<string, string>>>({})
  const processingIds = useRef(new Set<string>())
  const creating = useRef(false)
  const sessionExpired = isAxiosError(users.error) && users.error.response?.status === 401

  async function handleSubmit() {
    if (creating.current) return
    createUser.reset()
    const errors: string[] = []
    if (!userName.trim()) errors.push('Ingresa el nombre de usuario.')
    else if (userName.trim().length < 4) errors.push('El nombre de usuario debe tener al menos 4 caracteres.')
    if (password.length < 8) errors.push('La contraseña debe tener al menos 8 caracteres.')
    if (!/[A-Z]/.test(password)) errors.push('La contraseña debe incluir al menos una mayúscula.')
    if (!/[a-z]/.test(password)) errors.push('La contraseña debe incluir al menos una minúscula.')
    if (!/[0-9]/.test(password)) errors.push('La contraseña debe incluir al menos un número.')
    if (!roles.includes(role)) errors.push('Selecciona un rol.')
    if (associateEmployee && !selectedEmployee) errors.push('Selecciona un empleado o elige "Sin empleado asociado".')
    setValidationErrors(errors)
    if (errors.length > 0) return

    creating.current = true
    try {
      await createUser.mutateAsync({
        userName: userName.trim(),
        password,
        employeeId: associateEmployee ? selectedEmployee!.id : null,
        role,
      })
      setUserName('')
      setPassword('')
      setSelectedEmployee(null)
      setAssociateEmployee(false)
      setRole('')
    } catch {
      // La mutation conserva el error; el formulario conserva los datos para reintentar.
    } finally {
      creating.current = false
    }
  }

  async function toggleStatus(user: User) {
    if (processingIds.current.has(user.id)) return
    processingIds.current.add(user.id)
    setProcessing((current) => ({ ...current, [user.id]: true }))
    setStatusErrors((current) => ({ ...current, [user.id]: undefined }))
    try {
      await setUserStatus.mutateAsync({ userId: user.id, request: { isActive: !user.isActive } })
    } catch {
      setStatusErrors((current) => ({ ...current, [user.id]: 'No se pudo actualizar el estado del usuario.' }))
    } finally {
      processingIds.current.delete(user.id)
      setProcessing((current) => ({ ...current, [user.id]: false }))
    }
  }

  return (
    <section aria-labelledby="users-title" className="space-y-6">
      <div>
        <h1 id="users-title" className="text-3xl font-semibold tracking-tight text-slate-950">Usuarios</h1>
        <p className="mt-1 text-sm text-slate-600">Administra los usuarios que tienen acceso al sistema.</p>
      </div>

      <form
        noValidate
        onSubmit={(event) => { event.preventDefault(); void handleSubmit() }}
        aria-labelledby="create-user-title"
        aria-busy={createUser.isPending}
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 id="create-user-title" className="mb-5 text-lg font-semibold text-slate-900">Crear usuario</h2>
        <fieldset disabled={createUser.isPending} className="min-w-0 space-y-5">
          <legend className="sr-only">Datos del usuario</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="user-name" className="block text-sm font-medium text-slate-700">Usuario</label>
              <input id="user-name" required minLength={4} autoComplete="off" value={userName} onChange={(event) => setUserName(event.target.value)} className={inputClass} />
            </div>
            <div className="space-y-2">
              <label htmlFor="user-password" className="block text-sm font-medium text-slate-700">Contraseña</label>
              <input id="user-password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} aria-describedby="password-help" className={inputClass} />
              <p id="password-help" className="text-sm text-slate-500">Mínimo 8 caracteres, una mayúscula, una minúscula y un número. No requiere carácter especial.</p>
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="user-employee" className="block text-sm font-medium text-slate-700">Empleado (opcional)</label>
            <select id="user-employee" value={associateEmployee ? 'employee' : 'none'} onChange={(event) => { setAssociateEmployee(event.target.value === 'employee'); setSelectedEmployee(null) }} className={inputClass}>
              <option value="none">Sin empleado asociado</option>
              <option value="employee">Seleccionar empleado</option>
            </select>
          </div>
          {associateEmployee && (
            <EmployeeSelector selectedEmployee={selectedEmployee} onSelect={setSelectedEmployee} onClear={() => setSelectedEmployee(null)} />
          )}
          <div className="space-y-2">
            <label htmlFor="user-role" className="block text-sm font-medium text-slate-700">Rol</label>
            <select id="user-role" required value={role} onChange={(event) => setRole(event.target.value)} className={inputClass}>
              <option value="">Selecciona un rol</option>
              {roles.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>
          {validationErrors.length > 0 && (
            <div role="alert" className={errorClass}>
              <ul className="list-disc space-y-1 pl-5">{validationErrors.map((message) => <li key={message}>{message}</li>)}</ul>
            </div>
          )}
          {createUser.isError && <p role="alert" className={errorClass}>{getCreationError(createUser.error)}</p>}
          {createUser.isSuccess && <p role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">Usuario creado correctamente.</p>}
          <div className="flex justify-end border-t border-slate-200 pt-5">
            <button type="submit" disabled={createUser.isPending} className={buttonClass}>{createUser.isPending ? 'Creando...' : 'Crear usuario'}</button>
          </div>
        </fieldset>
      </form>

      <section aria-labelledby="registered-users-title" className="space-y-4">
        <h2 id="registered-users-title" className="text-lg font-semibold text-slate-900">Usuarios registrados</h2>
        {users.isPending && <p role="status" className="text-sm text-slate-600">Cargando usuarios...</p>}
        {users.isError && (
          <p role="alert" className={errorClass}>{sessionExpired ? 'Tu sesión ha expirado. Vuelve a iniciar sesión.' : 'No se pudieron cargar los usuarios. Inténtalo nuevamente.'}</p>
        )}
        {!users.isPending && !sessionExpired && users.data && (users.data.length === 0 ? (
          <p role="status" className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">No hay usuarios registrados.</p>
        ) : (
          <div role="region" aria-label="Listado de usuarios" tabIndex={0} className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">
            <table className="w-full min-w-180 text-left text-sm">
              <caption className="sr-only">Usuarios registrados y acciones para activar o desactivar su acceso</caption>
              <thead className="border-b border-slate-200 bg-slate-100 text-slate-700">
                <tr>{['Usuario', 'Empleado', 'Rol', 'Estado', 'Acción'].map((title) => <th key={title} scope="col" className="px-4 py-3 font-semibold">{title}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.data.map((user) => (
                  <tr key={user.id}>
                    <th scope="row" className="px-4 py-3 font-medium wrap-anywhere text-slate-900">{user.userName}</th>
                    <td className="px-4 py-3 wrap-anywhere text-slate-600">
                      {user.employeeName === null ? 'Sin empleado' : <><p>{user.employeeName}</p><p className="mt-1 text-xs text-slate-500">{user.payrollNumber}</p></>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{user.roles.join(', ')}</td>
                    <td className="px-4 py-3 text-slate-600">{user.isActive ? 'Activo' : 'Inactivo'}</td>
                    <td className="px-4 py-3">
                      <button type="button" disabled={!!processing[user.id]} aria-label={`${processing[user.id] ? 'Guardando estado de' : user.isActive ? 'Desactivar' : 'Activar'} ${user.userName}`} onClick={() => void toggleStatus(user)} className={buttonClass}>
                        {processing[user.id] ? 'Guardando...' : user.isActive ? 'Desactivar' : 'Activar'}
                      </button>
                      {statusErrors[user.id] && <p role="alert" className="mt-2 text-sm text-red-700">{statusErrors[user.id]}</p>}
                    </td>
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
