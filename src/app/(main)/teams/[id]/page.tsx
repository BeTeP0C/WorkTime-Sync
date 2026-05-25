import { TeamPageClient } from './TeamPageClient'

interface PageProps {
  params: { id: string }
}

export default function TeamPage({ params }: PageProps) {
  return <TeamPageClient teamId={params.id} />
}
