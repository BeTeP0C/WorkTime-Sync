import { API_URLS } from '@/shared/api/apiUrls'
import { apiClient } from '@/shared/api/client'

import { normalizeEmployee } from '../lib/normalize'
import { Employee, EmployeeRaw } from '../model/types'

export async function getEmployees(): Promise<Employee[]> {
  const data = await apiClient<EmployeeRaw[]>('GET', API_URLS.employees())
  return data.map(normalizeEmployee)
}

export async function getEmployee(id: string): Promise<Employee> {
  const data = await apiClient<EmployeeRaw>('GET', API_URLS.employee(id))
  return normalizeEmployee(data)
}
