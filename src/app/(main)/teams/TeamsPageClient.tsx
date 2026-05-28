'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import cn from 'classnames'
import { observer } from 'mobx-react-lite'

import { useAuthStore, useEmployeesStore, useTeamsStore } from '@/app-store/context'
import { isManagementRole } from '@/entities/auth/model/types'
import { Employee, EmployeeRaw, RiskLevel } from '@/entities/employee/model/types'
import { getTeamAvailabilityRanking } from '@/entities/team/api'
import { Team, TeamAvailabilityRankingItem, TeamRaw } from '@/entities/team/model/types'
import {
  ChartTreeIcon,
  PlusIcon,
  SearchIcon,
  UserIcon,
  WarningSmallIcon,
  XSmallIcon,
} from '@/shared/icons'
import { PARTICIPANTS_FORMS, pluralizeRu } from '@/shared/lib/format'
import { Avatar } from '@/shared/ui/Avatar'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { useConfirm } from '@/shared/ui/ConfirmDialog'
import { Input } from '@/shared/ui/Input'
import { ProgressBar, ProgressTone } from '@/shared/ui/ProgressBar'
import { AppHeader } from '@/widgets/AppHeader'

import s from './TeamsPageClient.module.scss'

interface TeamsPageClientProps {
  initialTeams: TeamRaw[] | null
  initialEmployees: EmployeeRaw[] | null
}

const MAX_VISIBLE_AVATARS = 5

type TeamFilter = 'all' | 'attention' | 'outdated'
type TeamSort = 'priority' | 'overlap'

interface TeamAggregate {
  members: Employee[]
  avgActuality: number | null
  attentionCount: number
  outdatedCount: number
  maxRiskLevel: RiskLevel | null
}

const RISK_ORDER: Record<RiskLevel, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
}

function maxRisk(a: RiskLevel | null, b: RiskLevel | null): RiskLevel | null {
  if (!a) return b
  if (!b) return a
  return RISK_ORDER[a] >= RISK_ORDER[b] ? a : b
}

function actualityTone(value: number | null): ProgressTone {
  if (value === null) return 'primary'
  if (value >= 0.75) return 'success'
  if (value >= 0.5) return 'medium'
  if (value >= 0.3) return 'high'
  return 'critical'
}

function aggregateTeam(members: Employee[]): TeamAggregate {
  let actualitySum = 0
  let actualityCount = 0
  let attentionCount = 0
  let outdatedCount = 0
  let topRisk: RiskLevel | null = null
  for (const emp of members) {
    const m = emp.metric
    if (!m) continue
    actualitySum += m.actualityScore
    actualityCount += 1
    if (m.riskLevel === 'high' || m.riskLevel === 'critical') attentionCount += 1
    if (m.daysSinceUpdate >= 60) outdatedCount += 1
    topRisk = maxRisk(topRisk, m.riskLevel)
  }
  return {
    members,
    avgActuality: actualityCount > 0 ? actualitySum / actualityCount : null,
    attentionCount,
    outdatedCount,
    maxRiskLevel: topRisk,
  }
}

export const TeamsPageClient = observer(function TeamsPageClient({
  initialTeams,
  initialEmployees,
}: TeamsPageClientProps) {
  const teams = useTeamsStore()
  const employees = useEmployeesStore()
  const auth = useAuthStore()
  const canCreateTeam = isManagementRole(auth.currentUser.value?.role)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<TeamFilter>('all')
  const [sort, setSort] = useState<TeamSort>('priority')
  const [rankingByTeam, setRankingByTeam] = useState<Map<string, TeamAvailabilityRankingItem>>(
    new Map()
  )

  useState(() => {
    if (typeof employees.resetFilters === 'function') employees.resetFilters()
    if (initialTeams) teams.hydrate(initialTeams)
    if (initialEmployees) employees.hydrate(initialEmployees)
    return true
  })

  useEffect(() => {
    if (!teams.list.loadingStage.isSuccessful) teams.fetch()
    employees.fetch()
    let cancelled = false
    getTeamAvailabilityRanking(7)
      .then((items) => {
        if (cancelled) return
        const next = new Map<string, TeamAvailabilityRankingItem>()
        for (const item of items) next.set(item.teamId, item)
        setRankingByTeam(next)
      })
      .catch((error) => {
        console.error('[TeamsPageClient] availability ranking failed', error)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const teamMembersMap = useMemo<Map<string, Employee[]>>(() => {
    const map = new Map<string, Employee[]>()
    for (const emp of employees.list.items) {
      for (const teamId of emp.teamIds) {
        const arr = map.get(teamId)
        if (arr) arr.push(emp)
        else map.set(teamId, [emp])
      }
    }
    return map
  }, [employees.list.items])

  const aggregatesByTeam = useMemo<Map<string, TeamAggregate>>(() => {
    const map = new Map<string, TeamAggregate>()
    for (const team of teams.list.items) {
      const members = teamMembersMap.get(team.id) ?? []
      map.set(team.id, aggregateTeam(members))
    }
    return map
  }, [teams.list.items, teamMembersMap])

  const filteredTeams = useMemo<Team[]>(() => {
    const q = query.trim().toLowerCase()
    let items = teams.list.items.slice()
    if (q) {
      items = items.filter((t) => {
        const haystack = [t.name, t.description].join(' ').toLowerCase()
        return haystack.includes(q)
      })
    }
    if (filter !== 'all') {
      items = items.filter((t) => {
        const a = aggregatesByTeam.get(t.id)
        if (!a) return false
        if (filter === 'attention') return a.attentionCount > 0
        if (filter === 'outdated') return a.outdatedCount > 0
        return true
      })
    }
    if (sort === 'overlap') {
      // Сортировка по cross-team overlap (худшие сверху — кому нужен пересмотр).
      items.sort((a, b) => {
        const ar = rankingByTeam.get(a.id)?.overlapRatio
        const br = rankingByTeam.get(b.id)?.overlapRatio
        const av = ar ?? Number.POSITIVE_INFINITY
        const bv = br ?? Number.POSITIVE_INFINITY
        if (av !== bv) return av - bv
        return a.name.localeCompare(b.name, 'ru')
      })
    } else {
      // Сортировка: команды с attention выше всех, потом outdated, потом по имени.
      items.sort((a, b) => {
        const aa = aggregatesByTeam.get(a.id)
        const bb = aggregatesByTeam.get(b.id)
        const aScore = (aa?.attentionCount ?? 0) * 10 + (aa?.outdatedCount ?? 0)
        const bScore = (bb?.attentionCount ?? 0) * 10 + (bb?.outdatedCount ?? 0)
        if (aScore !== bScore) return bScore - aScore
        return a.name.localeCompare(b.name, 'ru')
      })
    }
    return items
  }, [teams.list.items, query, filter, sort, aggregatesByTeam, rankingByTeam])

  const isLoading = !teams.list.loadingStage.isFinished
  const hasQuery = Boolean(query.trim())

  const totalAttention = useMemo(() => {
    let count = 0
    for (const a of aggregatesByTeam.values()) {
      if (a.attentionCount > 0) count += 1
    }
    return count
  }, [aggregatesByTeam])

  return (
    <>
      <AppHeader
        title="Команды"
        action={
          <>
            <div className={s.counter}>
              <ChartTreeIcon width={14} height={14} />
              <span>{teams.list.items.length}</span>
            </div>
            {canCreateTeam && (
              <Link href="/teams/create" className={s.createLink}>
                <Button variant="primary" size="md" leftIcon={<PlusIcon />}>
                  Создать команду
                </Button>
              </Link>
            )}
          </>
        }
      />

      <Card padding="md" className={s.toolbar}>
        <Input
          size="md"
          placeholder="Поиск по названию или описанию"
          leftIcon={<SearchIcon width={16} height={16} />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          fullWidth
          className={s.search}
        />

        <div className={s.filterChips}>
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
            Все команды
          </FilterChip>
          <FilterChip
            active={filter === 'attention'}
            tone="critical"
            onClick={() => setFilter('attention')}
          >
            Требуют внимания
            {totalAttention > 0 && <span className={s.chipCount}>{totalAttention}</span>}
          </FilterChip>
          <FilterChip
            active={filter === 'outdated'}
            tone="warning"
            onClick={() => setFilter('outdated')}
          >
            С устаревшими графиками
          </FilterChip>

          <span className={s.filterDivider} aria-hidden />

          <FilterChip active={sort === 'priority'} onClick={() => setSort('priority')}>
            По приоритету
          </FilterChip>
          <FilterChip active={sort === 'overlap'} onClick={() => setSort('overlap')}>
            По пересечению доступности
          </FilterChip>
        </div>
      </Card>

      {isLoading && (
        <div className={s.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} padding="md" className={s.skeletonCard} aria-hidden>
              <div className={s.skeletonTitle} />
              <div className={s.skeletonText} />
              <div className={s.skeletonRow}>
                <div className={s.skeletonAvatar} />
                <div className={s.skeletonAvatar} />
                <div className={s.skeletonAvatar} />
              </div>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && filteredTeams.length === 0 && (
        <Card padding="lg" className={s.emptyCard}>
          <div className={s.empty}>
            <div className={s.emptyIcon}>
              <ChartTreeIcon width={22} height={22} />
            </div>
            <div className={s.emptyTitle}>
              {hasQuery || filter !== 'all' ? 'Ничего не найдено' : 'Команд пока нет'}
            </div>
            <div className={s.emptyHint}>
              {hasQuery || filter !== 'all'
                ? 'Попробуйте изменить запрос или сбросить фильтры.'
                : 'Создайте первую команду — добавьте сотрудников и подберите общее окно встреч.'}
            </div>
            {!hasQuery && filter === 'all' && (
              <Link href="/teams/create" className={s.emptyAction}>
                <Button variant="primary" size="md" leftIcon={<PlusIcon />}>
                  Создать команду
                </Button>
              </Link>
            )}
          </div>
        </Card>
      )}

      {!isLoading && filteredTeams.length > 0 && (
        <div className={s.grid}>
          {filteredTeams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              aggregate={aggregatesByTeam.get(team.id) ?? aggregateTeam([])}
              ranking={rankingByTeam.get(team.id) ?? null}
            />
          ))}
        </div>
      )}
    </>
  )
})

interface TeamCardProps {
  team: Team
  aggregate: TeamAggregate
  ranking: TeamAvailabilityRankingItem | null
}

function TeamCard({ team, aggregate, ranking }: TeamCardProps) {
  const visible = aggregate.members.slice(0, MAX_VISIBLE_AVATARS)
  const hidden = Math.max(0, aggregate.members.length - visible.length)
  const actuality = aggregate.avgActuality
  const actualityPercent = actuality === null ? null : Math.round(actuality * 100)
  const overlapPercent = ranking ? Math.round(ranking.overlapRatio * 100) : null
  const overlapTone: ProgressTone =
    overlapPercent === null
      ? 'primary'
      : overlapPercent < 5
        ? 'critical'
        : overlapPercent < 15
          ? 'high'
          : 'success'

  const auth = useAuthStore()
  const teamsStore = useTeamsStore()
  const confirm = useConfirm()
  const canDelete = isManagementRole(auth.currentUser.value?.role)

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const ok = await confirm({
      title: `Удалить команду «${team.name}»?`,
      body: 'Команда и её связи с участниками будут удалены. Сами сотрудники останутся в системе.',
      confirmLabel: 'Удалить',
      danger: true,
    })
    if (!ok) return
    await teamsStore.delete(team.id)
  }

  return (
    <Link href={`/teams/${team.id}`} className={s.cardLink}>
      <Card padding="md" hover className={s.teamCard}>
        {canDelete && (
          <button
            type="button"
            className={s.cardDeleteBtn}
            onClick={handleDelete}
            aria-label={`Удалить команду ${team.name}`}
            title="Удалить команду"
          >
            <XSmallIcon width={14} height={14} />
          </button>
        )}
        <div className={s.cardHead}>
          <Avatar
            initials={team.initials}
            fullName={team.name}
            colorSeed={team.id}
            src={team.avatarUrl}
            shape="squircle"
            size="md"
          />
          <div className={s.cardHeadText}>
            <h3 className={s.cardTitle}>{team.name}</h3>
            <div className={s.cardMembersLabel}>
              <UserIcon width={12} height={12} />
              <span>
                {aggregate.members.length}{' '}
                {pluralizeRu(aggregate.members.length, PARTICIPANTS_FORMS)}
              </span>
            </div>
          </div>
        </div>

        {team.description && <p className={s.cardDescription}>{team.description}</p>}

        {actuality !== null && (
          <div className={s.metric}>
            <div className={s.metricHead}>
              <span className={s.metricLabel}>Актуальность графика</span>
              <span className={s.metricValue}>{actualityPercent}%</span>
            </div>
            <ProgressBar value={actuality} tone={actualityTone(actuality)} size="sm" />
          </div>
        )}

        {overlapPercent !== null && (
          <div className={s.metric}>
            <div className={s.metricHead}>
              <span className={s.metricLabel}>Пересечение доступности (7д)</span>
              <span className={s.metricValue}>{overlapPercent}%</span>
            </div>
            <ProgressBar value={ranking?.overlapRatio ?? 0} tone={overlapTone} size="sm" />
          </div>
        )}

        <div className={s.badgeRow}>
          {aggregate.attentionCount > 0 && (
            <Badge tone="critical" size="sm" pill>
              <WarningSmallIcon width={10} height={10} />
              <span style={{ marginLeft: 4 }}>{aggregate.attentionCount} требуют внимания</span>
            </Badge>
          )}
          {aggregate.outdatedCount > 0 && aggregate.attentionCount === 0 && (
            <Badge tone="warning" size="sm" pill>
              {aggregate.outdatedCount} устарели
            </Badge>
          )}
          {aggregate.attentionCount === 0 &&
            aggregate.outdatedCount === 0 &&
            actuality !== null && (
              <Badge tone="success" size="sm" pill>
                В норме
              </Badge>
            )}
        </div>

        <div className={s.cardFooter}>
          {visible.length > 0 ? (
            <div className={s.avatarStack}>
              {visible.map((m) => (
                <Avatar
                  key={m.id}
                  initials={m.initials}
                  fullName={m.fullName}
                  colorSeed={m.id}
                  size="sm"
                  className={s.avatarChip}
                />
              ))}
              {hidden > 0 && <span className={s.avatarCounter}>+{hidden}</span>}
            </div>
          ) : (
            <span className={s.noMembers}>Нет участников</span>
          )}
          <span className={s.cardLinkHint}>Открыть →</span>
        </div>
      </Card>
    </Link>
  )
}

interface FilterChipProps {
  active: boolean
  tone?: 'critical' | 'warning'
  children: React.ReactNode
  onClick: () => void
}

function FilterChip({ active, tone, children, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      className={cn(
        s.filterChip,
        active && s.filterChipActive,
        active && tone && s[`filterChip_${tone}`]
      )}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
