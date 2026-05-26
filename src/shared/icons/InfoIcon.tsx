import type { SVGProps } from 'react'

export const InfoIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M9 8V13"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="9" cy="5.5" r="0.75" fill="currentColor" />
    </svg>
  )
}
