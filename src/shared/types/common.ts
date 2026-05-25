export type Nullable<T> = T | null

export type ID = string

export enum LoadingStage {
  notStarted = 'notStarted',
  loading = 'loading',
  success = 'success',
  error = 'error',
}

export interface IList<T, C extends string | number | symbol = string> {
  keys: C[]
  entities: Map<C, T>
  items: T[]
  length: number
  isEmpty: boolean
}
