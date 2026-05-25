import { EmployeeProfileClient } from './EmployeeProfileClient'

interface PageProps {
  params: { id: string }
}

export default function EmployeeProfilePage({ params }: PageProps) {
  return <EmployeeProfileClient employeeId={params.id} />
}
