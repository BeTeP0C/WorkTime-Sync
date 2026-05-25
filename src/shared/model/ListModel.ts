import { action, computed, makeObservable, observable } from 'mobx'

import { IList } from '@/shared/types/common'

import { LoadingStageModel } from './LoadingStageModel'
import { ValueModel } from './ValueModel'

export class ListModel<T, C extends string | number | symbol = string> implements IList<T, C> {
  private _keys: C[]
  private _entities: Map<C, T>
  private _isAllLoaded: boolean

  readonly loadingStage = new LoadingStageModel()
  readonly isInitialLoading = new ValueModel<boolean>(true)
  readonly total = new ValueModel<number | null>(null)
  readonly page = new ValueModel<number>(1)

  constructor(
    { keys, entities, page = 1 }: { keys: C[]; entities: Map<C, T>; page?: number } = {
      keys: [],
      entities: new Map<C, T>(),
      page: 1,
    }
  ) {
    type PrivateFields = '_keys' | '_entities' | '_isAllLoaded'

    this._keys = keys
    this._entities = entities
    this._isAllLoaded = false
    this.page.change(page)

    makeObservable<ListModel<T, C>, PrivateFields>(this, {
      _keys: observable,
      _entities: observable,
      _isAllLoaded: observable,

      reset: action,
      removeEntity: action,
      addEntity: action,
      addEntities: action,
      setIsAllLoaded: action,
      incrementPage: action,

      keys: computed,
      entities: computed,
      length: computed,
      items: computed,
      isAllLoaded: computed,
      hasNextPage: computed,
      isEmpty: computed,
    })
  }

  get keys(): C[] {
    return this._keys
  }

  get entities(): Map<C, T> {
    return this._entities
  }

  get items(): T[] {
    const arr: T[] = []
    this._keys.forEach((id) => {
      const item = this._entities.get(id)
      if (item) arr.push(item)
    })
    return arr
  }

  get length(): number {
    return this.items.length
  }

  get isEmpty(): boolean {
    return this.items.length === 0
  }

  get isAllLoaded(): boolean {
    return this._isAllLoaded
  }

  get hasNextPage(): boolean {
    return !this._isAllLoaded
  }

  setIsAllLoaded = (isAllLoaded: boolean): void => {
    this._isAllLoaded = isAllLoaded
  }

  addEntity = ({ entity, key, start = false }: { entity: T; key: C; start?: boolean }): void => {
    if (this._keys.includes(key)) {
      this.removeEntity(key)
    }
    this._entities.set(key, entity)
    if (start) {
      this._keys.unshift(key)
    } else {
      this._keys.push(key)
    }
  }

  addEntities = ({
    entities,
    keys,
    initial,
    start,
  }: {
    entities: Map<C, T>
    keys: C[]
    initial: boolean
    start?: boolean
  }): void => {
    if (initial) {
      this._entities = entities
      this._keys = keys
      return
    }

    keys.forEach((key) => {
      const entity = entities.get(key)
      if (!entity) return
      this._entities.set(key, entity)
    })

    if (start) {
      this._keys.unshift(...keys)
    } else {
      this._keys.push(...keys)
    }

    this._keys = [...new Set(this._keys)]
  }

  reset = (): void => {
    this._keys = []
    this._entities = new Map()
  }

  removeEntity = (keyParam: C): void => {
    this._keys = this._keys.filter((key) => key !== keyParam)
    this._entities.delete(keyParam)
  }

  getEntity = (keyParam: C): T | null => {
    return this._entities.get(keyParam) || null
  }

  static createStructsByRawData<S, T, C extends string | number | symbol = string>(
    raw: S[],
    normalizer: (raw: S, index: number) => { entity: T; key: C }
  ): { keys: C[]; entities: Map<C, T> } {
    const keys: C[] = []
    const entities: Map<C, T> = new Map()

    raw.forEach((item, index) => {
      const { entity, key } = normalizer(item, index)
      keys.push(key)
      entities.set(key, entity)
    })

    return { keys, entities }
  }

  fillByRawData<S>(
    raw: S[],
    normalizer: (raw: S, index: number) => { entity: T; key: C },
    initial = false
  ): void {
    const { keys, entities } = ListModel.createStructsByRawData(raw, normalizer)
    this.addEntities({ entities, keys, initial })
  }

  incrementPage = (): void => {
    this.page.change(this.page.value + 1)
  }
}
