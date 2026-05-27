import { CSSProperties, HTMLAttributes } from 'react'
import cn from 'classnames'

import s from './Skeleton.module.scss'

type Radius = 'sm' | 'md' | 'lg' | 'pill' | 'circle'

interface SkeletonProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  width?: number | string
  height?: number | string
  radius?: Radius | number
  inline?: boolean
}

function toCssSize(v?: number | string): string | undefined {
  if (v == null) return undefined
  return typeof v === 'number' ? `${v}px` : v
}

export function Skeleton({
  width,
  height,
  radius = 'sm',
  inline,
  className,
  style,
  ...rest
}: SkeletonProps) {
  const isNamedRadius = typeof radius === 'string'

  const mergedStyle: CSSProperties = {
    width: toCssSize(width),
    height: toCssSize(height),
    borderRadius: isNamedRadius ? undefined : `${radius}px`,
    ...style,
  }

  return (
    <span
      className={cn(
        s.skeleton,
        inline && s.inline,
        isNamedRadius && s[`radius_${radius}`],
        className
      )}
      style={mergedStyle}
      aria-hidden
      {...rest}
    />
  )
}
