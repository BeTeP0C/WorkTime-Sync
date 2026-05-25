import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react'
import cn from 'classnames'

import s from './Button.module.scss'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    leftIcon,
    rightIcon,
    fullWidth,
    className,
    children,
    type = 'button',
    ...rest
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        s.button,
        s[`variant_${variant}`],
        s[`size_${size}`],
        fullWidth && s.fullWidth,
        className
      )}
      {...rest}
    >
      {leftIcon && <span className={s.icon}>{leftIcon}</span>}
      {children && <span className={s.label}>{children}</span>}
      {rightIcon && <span className={s.icon}>{rightIcon}</span>}
    </button>
  )
})
