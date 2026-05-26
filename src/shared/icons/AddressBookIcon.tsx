import type { SVGProps } from 'react'

export const AddressBookIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect x="2" y="1" width="10" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M5.5 5.5C5.5 4.672 6.172 4 7 4C7.828 4 8.5 4.672 8.5 5.5C8.5 6.328 7.828 7 7 7C6.172 7 5.5 6.328 5.5 5.5Z"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <path
        d="M4.5 10.5C4.5 9.119 5.619 8 7 8C8.381 8 9.5 9.119 9.5 10.5"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <path
        d="M0.75 4.5H2M0.75 7.5H2M0.75 10.5H2"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  )
}
