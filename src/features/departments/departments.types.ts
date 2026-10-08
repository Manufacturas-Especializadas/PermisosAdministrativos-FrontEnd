export interface Department {
  id: number
  name: string
  isActive: boolean
}

export interface CreateDepartmentRequest {
  name: string
}

export interface DepartmentImportResult {
  processed: number
  created: number
  ignored: number
  errors: string[]
}
