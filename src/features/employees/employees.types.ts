export interface Employee {
  id: number
  payrollNumber: string
  fullName: string
  departmentId: number
  departmentName: string
  isActive: boolean
}

export interface EmployeesResponse {
  items: Employee[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}
