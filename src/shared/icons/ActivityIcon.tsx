import type { SVGProps } from 'react'

export const ActivityIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M22 11h-3.382a1 1 0 0 0-.894.553L16 15l-3.106-9.316a1 1 0 0 0-1.898 0L8 13.382l-1.106-2.829A1 1 0 0 0 5.962 10H2a1 1 0 1 0 0 2h3.282l1.789 4.577a1 1 0 0 0 1.879-.027L11 9.162l2.95 8.854a1 1 0 0 0 1.844.131L18.618 13H22a1 1 0 1 0 0-2z"
        fill="currentColor"
      />
    </svg>
  )
}
