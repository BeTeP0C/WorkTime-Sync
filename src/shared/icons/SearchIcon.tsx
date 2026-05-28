import type { SVGProps } from 'react'

export const SearchIcon = (props: SVGProps<SVGSVGElement>) => {
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
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.25 1.5C4.52208 1.5 1.5 4.52208 1.5 8.25C1.5 11.9779 4.52208 15 8.25 15C9.85458 15 11.3286 14.4399 12.487 13.5048L15.4905 16.5083C15.7834 16.8012 16.2583 16.8012 16.5512 16.5083C16.8441 16.2154 16.8441 15.7405 16.5512 15.4476L13.5478 12.4441C14.4715 11.2885 15 9.83248 15 8.25C15 4.52208 11.9779 1.5 8.25 1.5ZM3 8.25C3 5.35051 5.35051 3 8.25 3C11.1495 3 13.5 5.35051 13.5 8.25C13.5 11.1495 11.1495 13.5 8.25 13.5C5.35051 13.5 3 11.1495 3 8.25Z"
        fill="currentColor"
      />
    </svg>
  )
}
