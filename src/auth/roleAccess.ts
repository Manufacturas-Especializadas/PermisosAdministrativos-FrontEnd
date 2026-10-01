interface ProtectedArea {
  path: string
  label: string
  title: string
  allowedRoles: string[]
}

// Esta configuración controla la navegación visual; el backend autoriza los datos.
export const protectedAreas: ProtectedArea[] = [
  {
    path: '/admin',
    label: 'Admin',
    title: 'Área de Administrator',
    allowedRoles: ['Administrator'],
  },
  {
    path: '/rh',
    label: 'RH',
    title: 'Área de Recursos Humanos',
    allowedRoles: ['HumanResources', 'Administrator'],
  },
  {
    path: '/supervisor',
    label: 'Supervisor',
    title: 'Área de Supervisor',
    allowedRoles: ['Supervisor', 'Administrator'],
  },
  {
    path: '/security',
    label: 'Security',
    title: 'Área de Seguridad',
    allowedRoles: ['Security', 'Administrator'],
  },
]

export function hasAllowedRole(userRoles: string[], allowedRoles: string[]): boolean {
  return userRoles.some((role) => allowedRoles.includes(role))
}
