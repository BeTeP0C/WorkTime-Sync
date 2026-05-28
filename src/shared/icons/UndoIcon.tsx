import type { SVGProps } from 'react'

export const UndoIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M2.25 6.75L6 3M2.25 6.75L6 10.5M2.25 6.75H11.25C13.7353 6.75 15.75 8.76472 15.75 11.25V12.75C15.75 13.9926 14.7426 15 13.5 15H9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
