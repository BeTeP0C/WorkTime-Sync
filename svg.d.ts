declare module '*.svg' {
  import { FC, SVGProps } from 'react'
  const ReactComponent: FC<SVGProps<SVGSVGElement>>
  export default ReactComponent
}

declare module '*.svg?url' {
  const content: string
  export default content
}
