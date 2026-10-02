export interface User {
  id: string
  userName: string
  employeeId: number | null
  payrollNumber: string | null
  employeeName: string | null
  isActive: boolean
  roles: string[]
}

export interface CreateUserRequest {
  userName: string
  password: string
  employeeId: number | null
  role: string
}

export interface SetUserStatusRequest {
  isActive: boolean
}
