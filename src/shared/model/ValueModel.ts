import { action, computed, makeObservable, observable } from 'mobx'

import { Validator, ValidatorResult } from '@/shared/types/validator'

export class ValueModel<T = string> {
  protected _value: T
  private _touched = false
  protected initialValue: T
  private validators: Validator<T>[]
  private _error: ValidatorResult = null
  private _success: ValidatorResult = null

  constructor(value: T, validators: Validator<T>[] = []) {
    this._value = value
    this.initialValue = value
    this.validators = validators

    makeObservable<ValueModel<T>, '_value' | '_touched' | '_error' | '_success'>(this, {
      _value: observable,
      _touched: observable,
      _error: observable,
      _success: observable,

      value: computed,
      touched: computed,
      error: computed,
      success: computed,
      isError: computed,
      isEmpty: computed,

      change: action.bound,
      changeError: action.bound,
      changeSuccess: action.bound,
      resetSuccess: action.bound,
      resetTouched: action.bound,
      resetError: action.bound,
      validate: action.bound,
      setValidators: action.bound,
      reset: action.bound,
    })
  }

  get value(): T {
    return this._value
  }

  get touched(): boolean {
    return this._touched
  }

  get error(): ValidatorResult {
    return this._error
  }

  get success(): ValidatorResult {
    return this._success
  }

  get isError(): boolean {
    return this._error !== null
  }

  get isEmpty(): boolean {
    return !this._value
  }

  validate(): boolean {
    let message: ValidatorResult = null

    for (const validator of this.validators) {
      message = validator(this._value)
      if (message) break
    }

    this.changeError(message)
    return this.isError
  }

  change(value: T): void {
    if (value === this._value) return
    this._value = value
    this.changeError(null)
    this.changeSuccess(null)
    this._touched = true
  }

  changeError(result: ValidatorResult): void {
    this._error = result
  }

  changeSuccess(result: ValidatorResult): void {
    this._success = result
  }

  resetSuccess(): void {
    this._success = null
  }

  resetTouched(): void {
    this._touched = false
  }

  resetError(): void {
    this.changeError(null)
  }

  setValidators(validators: Validator<T>[]): void {
    this.validators = validators
  }

  reset(): void {
    this.change(this.initialValue)
    this.resetTouched()
    this.resetError()
    this.resetSuccess()
  }
}
