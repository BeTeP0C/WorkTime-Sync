'use client'

import { ChangeEvent } from 'react'
import { observer } from 'mobx-react-lite'

import { useConflictsStore, useEmployeesStore, useTeamsStore } from '@/app-store/context'
import { Button } from '@/shared/ui/Button'

import s from './ConflictsFilterBar.module.scss'

interface ConflictsFilterBarProps {
  onApply: () => void
  onReset: () => void
}

export const ConflictsFilterBar = observer(function ConflictsFilterBar({
  onApply,
  onReset,
}: ConflictsFilterBarProps) {
  const conflicts = useConflictsStore()
  const teams = useTeamsStore()
  const employees = useEmployeesStore()

  const teamId = conflicts.filters.teamId.value
  const employeeId = conflicts.filters.employeeId.value
  const rangeStart = conflicts.filters.rangeStart.value
  const rangeEnd = conflicts.filters.rangeEnd.value
  const search = conflicts.filters.search.value

  const handleTeam = (e: ChangeEvent<HTMLSelectElement>) => {
    conflicts.filters.teamId.change(e.target.value || null)
    conflicts.filters.employeeId.change(null)
  }

  const handleEmployee = (e: ChangeEvent<HTMLSelectElement>) => {
    conflicts.filters.employeeId.change(e.target.value || null)
  }

  const handleRangeStart = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    conflicts.filters.rangeStart.change(value ? new Date(value).toISOString() : null)
  }

  const handleRangeEnd = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    conflicts.filters.rangeEnd.change(value ? new Date(value).toISOString() : null)
  }

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    conflicts.filters.search.change(e.target.value)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onApply()
  }

  const teamMembers = teamId
    ? employees.list.items.filter((emp) => emp.teamIds?.includes(teamId))
    : employees.list.items

  return (
    <form className={s.root} onSubmit={handleSubmit}>
      <div className={s.field}>
        <label className={s.label} htmlFor="conflicts-team">
          Команда
        </label>
        <select id="conflicts-team" className={s.select} value={teamId ?? ''} onChange={handleTeam}>
          <option value="">Все команды</option>
          {teams.list.items.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </div>

      <div className={s.field}>
        <label className={s.label} htmlFor="conflicts-employee">
          Сотрудник
        </label>
        <select
          id="conflicts-employee"
          className={s.select}
          value={employeeId ?? ''}
          onChange={handleEmployee}
        >
          <option value="">Все сотрудники</option>
          {teamMembers.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.fullName}
            </option>
          ))}
        </select>
      </div>

      <div className={s.field}>
        <label className={s.label} htmlFor="conflicts-from">
          От
        </label>
        <input
          id="conflicts-from"
          className={s.dateInput}
          type="date"
          value={rangeStart ? rangeStart.slice(0, 10) : ''}
          onChange={handleRangeStart}
        />
      </div>

      <div className={s.field}>
        <label className={s.label} htmlFor="conflicts-to">
          До
        </label>
        <input
          id="conflicts-to"
          className={s.dateInput}
          type="date"
          value={rangeEnd ? rangeEnd.slice(0, 10) : ''}
          onChange={handleRangeEnd}
        />
      </div>

      <div className={`${s.field} ${s.searchField}`}>
        <label className={s.label} htmlFor="conflicts-search">
          Поиск по названию
        </label>
        <input
          id="conflicts-search"
          className={s.dateInput}
          type="search"
          placeholder="Daily, Sync, Retro…"
          value={search}
          onChange={handleSearch}
        />
      </div>

      <div className={s.actions}>
        <Button type="button" variant="ghost" size="md" onClick={onReset}>
          Сбросить
        </Button>
        <Button type="submit" variant="primary" size="md">
          Применить
        </Button>
      </div>
    </form>
  )
})
