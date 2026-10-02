export interface Department {
  id: number
  name: string
  isActive: boolean
}

export interface CreateDepartmentRequest {
  name: string
}
