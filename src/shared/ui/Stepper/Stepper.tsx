import cn from 'classnames'

import { CheckSmallIcon } from '@/shared/icons'

import s from './Stepper.module.scss'

export type StepState = 'done' | 'active' | 'pending'

export interface Step {
  label: string
  state: StepState
}

interface StepperProps {
  steps: Step[]
  /** Если передан — пункты с state='done' становятся кликабельными. */
  onStepClick?: (index: number) => void
  className?: string
}

export function Stepper({ steps, onStepClick, className }: StepperProps) {
  return (
    <div className={cn(s.stepper, className)}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1
        const isClickable = onStepClick && step.state === 'done'
        const NodeTag = isClickable ? 'button' : 'div'
        return (
          <div key={step.label} className={s.item}>
            <NodeTag
              type={isClickable ? 'button' : undefined}
              onClick={isClickable ? () => onStepClick(index) : undefined}
              className={cn(s.node, isClickable && s.nodeClickable)}
            >
              <span className={cn(s.circle, s[`circle_${step.state}`])}>
                {step.state === 'done' ? (
                  <CheckSmallIcon className={s.icon} />
                ) : (
                  <span className={s.number}>{index + 1}</span>
                )}
              </span>
              <span className={cn(s.label, s[`label_${step.state}`])}>{step.label}</span>
            </NodeTag>
            {!isLast && <div className={cn(s.line, step.state === 'done' && s.line_done)} />}
          </div>
        )
      })}
    </div>
  )
}
