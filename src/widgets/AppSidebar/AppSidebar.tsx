'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import cn from 'classnames'
import { observer } from 'mobx-react-lite'

import { useAuthStore } from '@/app-store/context'
import { isHrNavRole, User, USER_ROLE_LABEL_RU } from '@/entities/auth/model/types'
import { getEmployee } from '@/entities/employee/api'
import {
  BellIcon,
  BurgerIcon,
  CalendarIcon,
  CalendarXIcon,
  ChartHistogramIcon,
  ChartPieIcon,
  ChartTreeIcon,
  ChatArrowDownIcon,
  HomeIcon,
  InterrogationIcon,
  LogoIcon,
  SignOutIcon,
  UploadIcon,
  UserAddIcon,
  UserIcon,
  XSmallIcon,
} from '@/shared/icons'
import { useConfirm } from '@/shared/ui/ConfirmDialog'

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

const HR_SECTIONS: NavSection[] = [
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
        href: '/employees',
        label: 'Профиль сотрудника',
        icon: UserIcon,
        match: (p) =>
          p === '/employees' || (p.startsWith('/employees/') && p !== '/employees/create'),
      },
      {
        href: '/employees/create',
        label: 'Добавить сотрудника',
        icon: UserAddIcon,
        match: (p) => p === '/employees/create',
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
      {
        href: '/upload',
        label: 'Загрузка данных',
        icon: UploadIcon,
        match: (p) => p === '/upload',
      },
    ],
  },
  {
    title: 'Команда',
    items: [
      {
        href: '/teams',
        label: 'Команда',
        icon: ChartTreeIcon,
        match: (p) => p === '/teams' || (p.startsWith('/teams/') && p !== '/teams/create'),
      },
      {
        href: '/teams/create',
        label: 'Создать команду',
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
      {
        href: '/assistant',
        label: 'AI-ассистент',
        icon: ChatArrowDownIcon,
        match: (p) => p === '/assistant',
      },
    ],
  },
]

function buildEmployeeSections(userId: string): NavSection[] {
  return [
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
      title: 'Мой профиль',
      items: [
        {
          href: `/employees/${userId}`,
          label: 'Профиль сотрудника',
          icon: UserIcon,
          match: (p) => p === `/employees/${userId}`,
        },
        {
          href: '/my/schedule',
          label: 'Рабочий график',
          icon: CalendarIcon,
          match: (p) => p === '/my/schedule',
        },
        {
          href: '/my/exceptions',
          label: 'Исключения',
          icon: CalendarXIcon,
          match: (p) => p.startsWith('/my/exceptions'),
        },
      ],
    },
    {
      title: 'Команда',
      items: [
        {
          href: '/teams',
          label: 'Моя команда',
          icon: ChartTreeIcon,
          match: (p) => p === '/teams' || p.startsWith('/teams/'),
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
        {
          href: '/notifications',
          label: 'Уведомления',
          icon: BellIcon,
          match: (p) => p === '/notifications',
        },
        {
          href: '/assistant',
          label: 'AI-ассистент',
          icon: ChatArrowDownIcon,
          match: (p) => p === '/assistant',
        },
      ],
    },
  ]
}

function buildSections(user: User | null): NavSection[] {
  if (!user) return []
  if (isHrNavRole(user.role)) return HR_SECTIONS
  return buildEmployeeSections(user.id)
}

export const AppSidebar = observer(function AppSidebar() {
  const pathname = usePathname() ?? ''
  const auth = useAuthStore()
  const router = useRouter()
  const user = auth.currentUser.value
  const [isMenuOpen, setMenuOpen] = useState(false)
  const [position, setPosition] = useState<string | null>(null)

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!isMenuOpen) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [isMenuOpen])

  useEffect(() => {
    setPosition(null)
    if (!user?.id) return
    let cancelled = false
    getEmployee(user.id)
      .then((emp) => {
        if (!cancelled) setPosition(emp.position?.trim() || null)
      })
      .catch(() => {
        // graceful: фолбэк на роль остаётся ниже в JSX
      })
    return () => {
      cancelled = true
    }
  }, [user?.id])

  const confirm = useConfirm()

  const handleLogout = async () => {
    const ok = await confirm({
      title: 'Выйти из аккаунта?',
      body: user
        ? `Текущая сессия (${user.fullName}) будет завершена.`
        : 'Текущая сессия будет завершена.',
      confirmLabel: 'Выйти',
      cancelLabel: 'Остаться',
    })
    if (!ok) return
    // Серверный logout async, но UI-redirect не ждём — локальное состояние
    // обнуляется в самом логауте, AuthGuard переведёт на /auth/login сам.
    void auth.logout()
    router.replace('/auth/login')
  }

  const sections = buildSections(user)
  const footerSubtitle = user ? (position ?? USER_ROLE_LABEL_RU[user.role]) : 'Не авторизован'

  return (
    <aside className={cn(s.sidebar, isMenuOpen && s.sidebarMenuOpen)}>
      <div className={s.topBar}>
        <div className={s.logo}>
          <LogoIcon className={s.logoIcon} />
          <div className={s.logoText}>
            <span className={s.logoTitle}>WorkTime</span>
            <span className={s.logoSubtitle}>Sync</span>
          </div>
        </div>

        <button
          type="button"
          className={s.burger}
          aria-label={isMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
          aria-expanded={isMenuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {isMenuOpen ? (
            <XSmallIcon className={s.burgerIcon} />
          ) : (
            <BurgerIcon className={s.burgerIcon} />
          )}
        </button>
      </div>

      <div className={s.divider} />

      <div className={cn(s.menuWrap, isMenuOpen && s.menuWrapOpen)}>
        <nav className={s.nav}>
          {sections.map((section) => (
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
          {user ? (
            <Link href="/my/profile" className={s.profileLink} title="Перейти к моему профилю">
              <div className={s.profileAvatar}>{user.initials}</div>
              <div className={s.profileInfo}>
                <div className={s.profileName}>{user.fullName}</div>
                <div className={s.profileRole}>{footerSubtitle}</div>
              </div>
            </Link>
          ) : (
            <div className={s.profileLink}>
              <div className={s.profileAvatar}>??</div>
              <div className={s.profileInfo}>
                <div className={s.profileName}>Гость</div>
                <div className={s.profileRole}>{footerSubtitle}</div>
              </div>
            </div>
          )}
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
      </div>
    </aside>
  )
})
