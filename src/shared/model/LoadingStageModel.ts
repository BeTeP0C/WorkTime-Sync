import { action, computed, makeObservable, observable } from 'mobx'

import { LoadingStage } from '@/shared/types/common'

export class LoadingStageModel {
  private _value: LoadingStage

  constructor(value: LoadingStage = LoadingStage.notStarted) {
    this._value = value

    makeObservable<LoadingStageModel, '_value'>(this, {
      _value: observable,

      value: computed,
      isLoading: computed,
      isError: computed,
      isFinished: computed,
      isNotStarted: computed,
      isSuccessful: computed,
      isInitial: computed,

      loading: action.bound,
      success: action.bound,
      error: action.bound,
      reset: action.bound,
    })
  }

  get value(): LoadingStage {
    return this._value
  }

  get isNotStarted(): boolean {
    return this._value === LoadingStage.notStarted
  }

  get isLoading(): boolean {
    return this._value === LoadingStage.loading
  }

  get isInitial(): boolean {
    return this._value === LoadingStage.loading || this._value === LoadingStage.notStarted
  }

  get isError(): boolean {
    return this._value === LoadingStage.error
  }

  get isFinished(): boolean {
    return this._value === LoadingStage.success || this._value === LoadingStage.error
  }

  get isSuccessful(): boolean {
    return this._value === LoadingStage.success
  }

  loading(): void {
    this._value = LoadingStage.loading
  }

  success(): void {
    this._value = LoadingStage.success
  }

  error(): void {
    this._value = LoadingStage.error
  }

  reset(): void {
    this._value = LoadingStage.notStarted
  }
}
