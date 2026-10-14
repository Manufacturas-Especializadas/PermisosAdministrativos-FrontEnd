import { isAxiosError } from 'axios'
import { useRef, useState } from 'react'
import Alert from '../components/Alert'
import Button from '../components/Button'
import StatusBadge from '../components/StatusBadge'
import TableContainer from '../components/TableContainer'
import { EmployeeSelector } from '../features/employees/components/EmployeeSelector'
import type { Employee } from '../features/employees/employees.types'
import { useCreateUser } from '../features/users/hooks/useCreateUser'
import { useSetUserStatus } from '../features/users/hooks/useSetUserStatus'
import { useUsers } from '../features/users/hooks/useUsers'
import type { User } from '../features/users/users.types'

const roles = ['Administrator', 'Supervisor', 'HumanResources', 'Security']

function getCreationError(error: unknown): string {
  if (isAxiosError<{ detail?: unknown; title?: unknown }>(error) && error.response?.status === 400) {
    for (const message of [error.response.data?.detail, error.response.data?.title]) {
      if (typeof message === 'string' && message.trim()) return message.trim()
    }
  }
  return 'No se pudo crear el usuario. Revisa los datos e inténtalo nuevamente.'
}

export default function UsersPage() {
  const [createOpen, setCreateOpen] = useState(false)
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
    if (password.length < 4) errors.push('La contraseña debe tener al menos 4 caracteres.')

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

  function renderStatusAction(user: User) {
    return (
      <div className="min-w-0 space-y-3">
        <Button
          variant={user.isActive ? 'danger-outline' : 'secondary'}
          disabled={!!processing[user.id]}
          loading={!!processing[user.id]}
          aria-label={`${processing[user.id] ? 'Guardando estado de' : user.isActive ? 'Desactivar' : 'Activar'} ${user.userName}`}
          onClick={() => void toggleStatus(user)}
          className="w-full md:w-auto"
        >
          {processing[user.id] ? 'Guardando...' : user.isActive ? 'Desactivar' : 'Activar'}
        </Button>
        {statusErrors[user.id] && <Alert>{statusErrors[user.id]}</Alert>}
      </div>
    )
  }

  return (
    <section aria-labelledby="users-title" className="min-w-0 space-y-6 text-mesa-text">
      <header className="space-y-2">
        <h1 id="users-title" className="text-3xl font-semibold tracking-tight">Usuarios</h1>
        <p className="text-mesa-muted">Administra los usuarios que tienen acceso al sistema.</p>
      </header>

      <div className="min-w-0 space-y-4">
        <Button
          aria-expanded={createOpen}
          aria-controls="create-user-panel"
          onClick={() => setCreateOpen((open) => !open)}
          className="w-full md:w-auto"
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
            <path d={createOpen ? 'm6 15 6-6 6 6' : 'M12 5v14M5 12h14'} />
          </svg>
          Crear usuario
        </Button>
        <form
          id="create-user-panel"
          hidden={!createOpen}
          noValidate
          onSubmit={(event) => { event.preventDefault(); void handleSubmit() }}
          aria-labelledby="create-user-title"
          aria-describedby={validationErrors.length > 0 ? 'create-user-validation' : undefined}
          aria-busy={createUser.isPending}
          className="min-w-0 space-y-5 rounded-xl border border-mesa-border bg-white p-4 md:p-6"
        >
          <h2 id="create-user-title" className="text-lg font-semibold">Crear usuario</h2>
          <fieldset disabled={createUser.isPending} className="min-w-0 space-y-6">
            <legend className="sr-only">Datos del usuario</legend>
            <section aria-labelledby="user-access-title" className="min-w-0 space-y-4">
              <h3 id="user-access-title" className="font-semibold">Acceso</h3>
              <div className="grid min-w-0 gap-4 md:grid-cols-2">
                <div className="min-w-0 space-y-2">
                  <label htmlFor="user-name" className="block text-sm font-medium">Usuario</label>
                  <input id="user-name" required minLength={4} autoComplete="off" value={userName} onChange={(event) => setUserName(event.target.value)} aria-describedby="user-name-help" className="mesa-input min-w-0" />
                  <p id="user-name-help" className="text-sm text-mesa-muted">Mínimo 4 caracteres.</p>
                </div>
                <div className="min-w-0 space-y-2">
                  <label htmlFor="user-password" className="block text-sm font-medium">Contraseña</label>
                  <input id="user-password" type="password" required minLength={4} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} aria-describedby="password-help" className="mesa-input min-w-0" />
                  <p id="password-help" className="text-sm leading-relaxed text-mesa-muted">
                    Entre 4 y 64 caracteres. No necesitas mayúsculas, minúsculas,
                    números ni caracteres especiales.
                  </p>
                </div>
              </div>
            </section>

            <section aria-labelledby="user-employee-title" className="min-w-0 space-y-4 border-t border-mesa-border pt-5">
              <h3 id="user-employee-title" className="font-semibold">Empleado asociado</h3>
              <div className="space-y-2">
                <label htmlFor="user-employee" className="block text-sm font-medium">Empleado (opcional)</label>
                <select id="user-employee" value={associateEmployee ? 'employee' : 'none'} onChange={(event) => { setAssociateEmployee(event.target.value === 'employee'); setSelectedEmployee(null) }} className="mesa-input">
                  <option value="none">Sin empleado asociado</option>
                  <option value="employee">Seleccionar empleado</option>
                </select>
              </div>
              {associateEmployee && (
                <div className="min-w-0 wrap-anywhere [&_input]:min-w-0 [&_input]:min-h-12 [&_input]:text-base [&_button]:min-h-12 [&_button]:focus-visible:outline-2 [&_button]:focus-visible:outline-offset-2 [&_button]:focus-visible:outline-mesa-primary">
                  <EmployeeSelector selectedEmployee={selectedEmployee} onSelect={setSelectedEmployee} onClear={() => setSelectedEmployee(null)} />
                </div>
              )}
            </section>

            <section aria-labelledby="user-profile-title" className="min-w-0 space-y-4 border-t border-mesa-border pt-5">
              <h3 id="user-profile-title" className="font-semibold">Perfil</h3>
              <div className="space-y-2 md:max-w-md">
                <label htmlFor="user-role" className="block text-sm font-medium">Rol</label>
                <select id="user-role" required value={role} onChange={(event) => setRole(event.target.value)} className="mesa-input">
                  <option value="">Selecciona un rol</option>
                  {roles.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </div>
            </section>
            {validationErrors.length > 0 && (
              <Alert id="create-user-validation">
                <ul className="list-disc space-y-1 pl-5">{validationErrors.map((message) => <li key={message}>{message}</li>)}</ul>
              </Alert>
            )}
            {createUser.isError && <Alert>{getCreationError(createUser.error)}</Alert>}
            {createUser.isSuccess && <Alert variant="success">Usuario creado correctamente.</Alert>}
            <div className="flex border-t border-mesa-border pt-5 md:justify-end">
              <Button type="submit" disabled={createUser.isPending} loading={createUser.isPending} className="w-full md:w-auto">{createUser.isPending ? 'Creando...' : 'Crear usuario'}</Button>
            </div>
          </fieldset>
        </form>
      </div>

      <section aria-labelledby="registered-users-title" className="min-w-0 space-y-4">
        <div className="space-y-1">
          <h2 id="registered-users-title" className="text-lg font-semibold">Usuarios registrados</h2>
          <p role="status" className="text-sm text-mesa-muted">
            {!users.isPending && users.isFetching ? 'Actualizando usuarios...' : ''}
          </p>
        </div>
        {users.isPending && <p role="status" className="rounded-xl border border-mesa-border bg-white p-6 text-mesa-muted">Cargando usuarios...</p>}
        {users.isError && (
          <Alert>
            <p>{sessionExpired ? 'Tu sesión ha expirado. Vuelve a iniciar sesión.' : 'No se pudieron cargar los usuarios. Inténtalo nuevamente.'}</p>
            {!sessionExpired && !!users.data?.length && <p className="mt-2">Los datos mostrados corresponden a la última consulta correcta y existe un problema actualizando la información.</p>}
          </Alert>
        )}
        {!users.isPending && !sessionExpired && users.data && (users.data.length === 0 ? (
          <p role="status" className="rounded-xl border border-mesa-border bg-white p-6 text-mesa-muted">No hay usuarios registrados.</p>
        ) : (
          <>
            <ul aria-label="Listado de usuarios" aria-busy={users.isFetching} className="min-w-0 space-y-3 md:hidden">
              {users.data.map((user) => (
                <li key={user.id} className="min-w-0 space-y-4 rounded-xl border border-mesa-border bg-white p-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold wrap-anywhere">{user.userName}</h3>
                    <StatusBadge isActive={user.isActive} />
                  </div>
                  <dl className="min-w-0 space-y-3 text-sm">
                    <div className="min-w-0">
                      <dt className="font-medium text-mesa-muted">Empleado</dt>
                      <dd className="mt-1 wrap-anywhere">{user.employeeName === null ? 'Sin empleado' : user.employeeName}</dd>
                    </div>
                    {user.employeeName !== null && (
                      <div className="min-w-0">
                        <dt className="font-medium text-mesa-muted">Nómina</dt>
                        <dd className="mt-1 tabular-nums wrap-anywhere">{user.payrollNumber}</dd>
                      </div>
                    )}
                    <div className="min-w-0">
                      <dt className="font-medium text-mesa-muted">Roles</dt>
                      <dd className="mt-1 wrap-anywhere">{user.roles.join(', ')}</dd>
                    </div>
                  </dl>
                  <div className="border-t border-mesa-border pt-4">{renderStatusAction(user)}</div>
                </li>
              ))}
            </ul>
            <TableContainer label="Listado de usuarios" busy={users.isFetching} className="hidden md:block">
              <table className="w-full min-w-180 table-fixed text-left text-sm">
                <caption className="sr-only">Usuarios registrados y acciones para activar o desactivar su acceso</caption>
                <thead className="border-b border-mesa-border bg-mesa-canvas text-mesa-muted">
                  <tr>
                    <th scope="col" className="w-[36%] px-4 py-3 font-semibold">Usuario / Empleado</th>
                    <th scope="col" className="w-[24%] px-4 py-3 font-semibold">Rol</th>
                    <th scope="col" className="w-[18%] px-4 py-3 font-semibold">Estado</th>
                    <th scope="col" className="w-[22%] px-4 py-3 font-semibold">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mesa-border">
                  {users.data.map((user) => (
                    <tr key={user.id} className="align-top">
                      <th scope="row" className="px-4 py-4 wrap-anywhere">
                        <p className="font-semibold">{user.userName}</p>
                        <div className="mt-2 space-y-1 font-normal text-mesa-muted">
                          {user.employeeName === null ? 'Sin empleado' : <><p>{user.employeeName}</p><p className="tabular-nums">Nómina: {user.payrollNumber}</p></>}
                        </div>
                      </th>
                      <td className="px-4 py-4 wrap-anywhere">{user.roles.join(', ')}</td>
                      <td className="px-4 py-4"><StatusBadge isActive={user.isActive} /></td>
                      <td className="px-4 py-4">{renderStatusAction(user)}</td>
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
