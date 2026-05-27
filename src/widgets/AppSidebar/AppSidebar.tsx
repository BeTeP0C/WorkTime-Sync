'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { observer } from 'mobx-react-lite'

import cn from 'classnames'

import { useAuthStore } from '@/app-store/context'
import { USER_ROLE_LABEL_RU } from '@/entities/auth/model/types'
import {
  ChartHistogramIcon,
  ChartPieIcon,
  ChartTreeIcon,
  HomeIcon,
  InterrogationIcon,
  LogoIcon,
  SignOutIcon,
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

export const AppSidebar = observer(function AppSidebar() {
  const pathname = usePathname() ?? ''
  const auth = useAuthStore()
  const router = useRouter()
  const user = auth.currentUser.value

  const handleLogout = () => {
    auth.logout()
    router.replace('/auth/login')
  }

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
        <div className={s.profileAvatar}>{user?.initials ?? '??'}</div>
        <div className={s.profileInfo}>
          <div className={s.profileName}>{user?.fullName ?? 'Гость'}</div>
          <div className={s.profileRole}>
            {user ? USER_ROLE_LABEL_RU[user.role] : 'Не авторизован'}
          </div>
        </div>
        {user && (
          <button
            type="button"
            className={s.logout}
            onClick={handleLogout}
            aria-label="Выйти"
            title="Выйти"
          >
            <SignOutIcon className={s.logoutIcon} />
          </button>
        )}
      </div>
    </aside>
  )
})
