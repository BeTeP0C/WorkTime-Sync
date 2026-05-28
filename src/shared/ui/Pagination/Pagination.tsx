import cn from 'classnames'

import s from './Pagination.module.scss'

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (next: number) => void
}

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (totalPages <= 1) return null

  const goto = (next: number) => {
    if (next < 1 || next > totalPages || next === page) return
    onPageChange(next)
  }

  const pages = computeVisiblePages(page, totalPages)

  return (
    <nav className={s.root} aria-label="Пагинация">
      <button
        type="button"
        className={s.btn}
        onClick={() => goto(page - 1)}
        disabled={page === 1}
        aria-label="Предыдущая страница"
      >
        ← Пред.
      </button>
      {pages.map((p, idx) =>
        p === 'ellipsis' ? (
          <span key={`ellipsis-${idx}`} className={s.ellipsis}>
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            className={cn(s.btn, s.numBtn, p === page && s.btnActive)}
            onClick={() => goto(p)}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        )
      )}
      <button
        type="button"
        className={s.btn}
        onClick={() => goto(page + 1)}
        disabled={page === totalPages}
        aria-label="Следующая страница"
      >
        След. →
      </button>
    </nav>
  )
}

type Slot = number | 'ellipsis'

function computeVisiblePages(current: number, total: number): Slot[] {
  // Простая компактная схема: до 7 страниц — все подряд; иначе 1 … current-1 current current+1 … total
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const slots: Slot[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) slots.push('ellipsis')
  for (let p = start; p <= end; p++) slots.push(p)
  if (end < total - 1) slots.push('ellipsis')
  slots.push(total)
  return slots
}
