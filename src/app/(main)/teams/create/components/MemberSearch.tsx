'use client'

import { forwardRef, useEffect, useRef, useState } from 'react'
import cn from 'classnames'

import { Employee } from '@/entities/employee/model/types'
import { PlusIcon, SearchIcon } from '@/shared/icons'
import { Avatar } from '@/shared/ui/Avatar'
import { Input } from '@/shared/ui/Input'

import { extractUtcOffset } from './timezone'

import s from './MemberSearch.module.scss'

interface MemberSearchProps {
  candidates: Employee[]
  onAdd: (employee: Employee) => void
  disabled?: boolean
}

function filterCandidates(items: Employee[], query: string): Employee[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return items
    .filter((emp) => {
      return (
        emp.fullName.toLowerCase().includes(q) ||
        emp.email?.toLowerCase().includes(q) ||
        emp.position.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q)
      )
    })
    .slice(0, 6)
}

export const MemberSearch = forwardRef<HTMLInputElement, MemberSearchProps>(function MemberSearch(
  { candidates, onAdd, disabled },
  ref
) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const results = filterCandidates(candidates, query)
  const showDropdown = isOpen && query.trim().length > 0

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (emp: Employee) => {
    onAdd(emp)
    setQuery('')
    setIsOpen(false)
  }

  return (
    <div ref={wrapperRef} className={s.wrapper}>
      <Input
        ref={ref}
        size="lg"
        fullWidth
        leftIcon={<SearchIcon />}
        placeholder="Поиск по имени, email или отделу..."
        value={query}
        disabled={disabled}
        onChange={(e) => {
          setQuery(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
      />

      {showDropdown && (
        <div className={s.dropdown}>
          {results.length === 0 ? (
            <div className={s.empty}>Никого не найдено</div>
          ) : (
            results.map((emp) => {
              const utc = extractUtcOffset(emp.timezoneLabel)
              return (
                <button
                  key={emp.id}
                  type="button"
                  className={s.item}
                  onClick={() => handleSelect(emp)}
                >
                  <Avatar
                    initials={emp.initials}
                    fullName={emp.fullName}
                    colorSeed={emp.id}
                    size="sm"
                  />
                  <div className={s.itemInfo}>
                    <div className={s.itemName}>{emp.fullName}</div>
                    <div className={s.itemPosition}>{emp.position}</div>
                  </div>
                  {utc && <span className={s.itemTz}>{utc}</span>}
                  <span className={cn(s.itemAddIcon)}>
                    <PlusIcon />
                  </span>
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
})
