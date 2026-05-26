'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import cn from 'classnames'

import {
  ChartHistogramIcon,
  ChartPieIcon,
  ChartTreeIcon,
  HomeIcon,
  InterrogationIcon,
  LogoIcon,
  UserAddIcon,
  UserIcon,
} from '@/shared/icons'

import s from './AppSidebar.module.scss'

type IconComponent = (props: React.SVGProps<SVGSVGElement>) => JSX.Element

interface NavItem {
  href: string
  label: string
  icon: IconComponent
  match: (pathname: string) => boolean
}

interface NavSection {
  title: string
  items: NavItem[]
}

const SECTIONS: NavSection[] = [
  {
    title: 'Главная',
    items: [
      {
        href: '/dashboard',
        label: 'Главная',
        icon: HomeIcon,
        match: (p) => p === '/dashboard',
      },
    ],
  },
  {
    title: 'Сотрудники',
    items: [
      {
        href: '/employees/emp-mp',
        label: 'Профиль сотрудника',
        icon: UserIcon,
        match: (p) => p.startsWith('/employees/'),
      },
      {
        href: '/diagnostics',
        label: 'Диагностика',
        icon: ChartPieIcon,
        match: (p) => p === '/diagnostics',
      },
      {
        href: '/metrics',
        label: 'Расчёт показателей',
        icon: ChartHistogramIcon,
        match: (p) => p === '/metrics',
      },
    ],
  },
  {
    title: 'Команда',
    items: [
      {
        href: '/teams/team-dev',
        label: 'Команда',
        icon: ChartTreeIcon,
        match: (p) => p.startsWith('/teams/') && p !== '/teams/create',
      },
      {
        href: '/teams/create',
        label: 'Создание команды',
        icon: UserAddIcon,
        match: (p) => p === '/teams/create',
      },
    ],
  },
  {
    title: 'Планирование',
    items: [
      {
        href: '/recommendations',
        label: 'Рекомендации',
        icon: InterrogationIcon,
        match: (p) => p === '/recommendations',
      },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname() ?? ''

  return (
    <aside className={s.sidebar}>
      <div className={s.logo}>
        <LogoIcon className={s.logoIcon} />
        <div className={s.logoText}>
          <span className={s.logoTitle}>WorkTime</span>
          <span className={s.logoSubtitle}>Sync</span>
        </div>
      </div>

      <div className={s.divider} />

      <nav className={s.nav}>
        {SECTIONS.map((section) => (
          <div key={section.title} className={s.section}>
            <div className={s.sectionTitle}>{section.title}</div>
            {section.items.map((item) => {
              const active = item.match(pathname)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(s.navLink, active && s.navLinkActive)}
                >
                  <Icon className={s.navIcon} />
                  <span className={s.navLabel}>{item.label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className={s.divider} />

      <div className={s.profile}>
        <div className={s.profileAvatar}>АИ</div>
        <div className={s.profileInfo}>
          <div className={s.profileName}>Алексей Иванов</div>
          <div className={s.profileRole}>Руководитель</div>
        </div>
      </div>
    </aside>
  )
}
