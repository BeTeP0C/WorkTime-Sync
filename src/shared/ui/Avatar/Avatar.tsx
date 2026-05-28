import cn from 'classnames'

import s from './Avatar.module.scss'

interface AvatarProps {
  initials: string
  fullName?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /** seed-цвет — обычно id сотрудника/команды, чтобы цвет был стабильным */
  colorSeed?: string
  /** явный цвет фона — переопределяет colorSeed */
  bg?: string
  /** URL картинки. Если задан — рендерим изображение вместо инициалов. */
  src?: string | null
  /** Радиус: round (по умолчанию, для людей) или squircle (для команд/групп). */
  shape?: 'round' | 'squircle'
  className?: string
}

const PALETTE = [
  '#e11d48', // rose
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#0ea5e9', // sky
  '#6366f1', // indigo
  '#a855f7', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
]

function pickColor(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0
  }
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

export function Avatar({
  initials,
  fullName,
  size = 'md',
  colorSeed,
  bg: bgProp,
  src,
  shape = 'round',
  className,
}: AvatarProps) {
  const bg = bgProp ?? pickColor(colorSeed ?? fullName ?? initials)
  const classes = cn(s.avatar, s[`size_${size}`], s[`shape_${shape}`], className)

  if (src) {
    return <img className={classes} src={src} alt={fullName ?? initials} title={fullName} />
  }

  return (
    <div className={classes} style={{ background: bg }} title={fullName}>
      {initials}
    </div>
  )
}
