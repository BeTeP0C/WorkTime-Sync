import type { SVGProps } from 'react'

/**
 * 4-конечная искра — используется как маркер AI-блоков (например, в шапке
 * MeetingFinderPanel «AI: лучшее время для встречи»). Раньше тот же SVG
 * был встроен inline в каждое место использования.
 */
export const SparkleIcon = (props: SVGProps<SVGSVGElement>) => {
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
        d="M9 2v3M9 13v3M2 9h3M13 9h3M4.5 4.5l2 2M11.5 11.5l2 2M4.5 13.5l2-2M11.5 6.5l2-2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}
