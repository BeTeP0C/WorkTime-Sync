'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import cn from 'classnames'

import { Avatar } from '@/shared/ui/Avatar'

import s from './AppSidebar.module.scss'

interface NavItem {
  href: string
  label: string
  match: (pathname: string) => boolean
}

interface NavSection {
  title: string
  items: NavItem[]
}

const SECTIONS: NavSection[] = [
  {
    title: 'Главная',
    items: [{ href: '/dashboard', label: 'Главная', match: (p) => p === '/dashboard' }],
  },
  {
    title: 'Сотрудники',
    items: [
      {
        href: '/employees/emp-mp',
        label: 'Профиль сотрудника',
        match: (p) => p.startsWith('/employees/'),
      },
      { href: '/diagnostics', label: 'Диагностика', match: (p) => p === '/diagnostics' },
    ],
  },
  {
    title: 'Команда',
    items: [{ href: '/teams/team-dev', label: 'Команда', match: (p) => p.startsWith('/teams/') }],
  },
  {
    title: 'Планирование',
    items: [
      { href: '/recommendations', label: 'Рекомендации', match: (p) => p === '/recommendations' },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname() ?? ''

  return (
    <aside className={s.sidebar}>
      <Link href="/dashboard" className={s.logo}>
        <span className={s.logoIcon}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect width="20" height="20" rx="5" fill="#2563eb" />
            <circle cx="10" cy="10" r="5" stroke="white" strokeWidth="1.5" fill="none" />
            <path d="M10 7v3l2 1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
        <span className={s.logoText}>
          <span className={s.logoTitle}>WorkTime</span>
          <span className={s.logoSubtitle}>Sync</span>
        </span>
      </Link>

      <nav className={s.nav}>
        {SECTIONS.map((section) => (
          <div key={section.title} className={s.section}>
            <div className={s.sectionTitle}>{section.title}</div>
            {section.items.map((item) => {
              const active = item.match(pathname)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(s.navLink, active && s.navLinkActive)}
                >
                  <span className={s.navDot} aria-hidden />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className={s.profile}>
        <Avatar initials="АИ" fullName="Алиса Иванова" colorSeed="head" size="md" />
        <div className={s.profileInfo}>
          <div className={s.profileName}>Алиса Иванова</div>
          <div className={s.profileRole}>Руководитель</div>
        </div>
      </div>
    </aside>
  )
}
