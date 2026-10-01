interface ProtectedFeature {
  path: string
  label: string
  allowedRoles: string[]
}

// Esta configuración controla la navegación visual; el backend autoriza los datos.
export const protectedFeatures: ProtectedFeature[] = [
  {
    path: '/permits/create',
    label: 'Registrar permiso',
    allowedRoles: ['Supervisor', 'Administrator'],
  },
  {
    path: '/permits/pending',
    label: 'Permisos pendientes',
    allowedRoles: ['HumanResources', 'Administrator'],
  },
  {
    path: '/permits/approved',
    label: 'Salidas autorizadas',
    allowedRoles: ['Security', 'Administrator'],
  },
  {
    path: '/employees',
    label: 'Empleados',
    allowedRoles: ['HumanResources', 'Administrator'],
  },
  {
    path: '/departments',
    label: 'Departamentos',
    allowedRoles: ['Administrator'],
  },
  {
    path: '/users',
    label: 'Usuarios',
    allowedRoles: ['Administrator'],
  },
]

export function hasAllowedRole(userRoles: string[], allowedRoles: string[]): boolean {
  return userRoles.some((role) => allowedRoles.includes(role))
}
