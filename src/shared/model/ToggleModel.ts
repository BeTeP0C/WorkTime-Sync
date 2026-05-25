import { computed, makeObservable, observable } from 'mobx'

import { Validator } from '@/shared/types/validator'

import { ValueModel } from './ValueModel'

export class ToggleModel extends ValueModel<boolean> {
  isDisabled = false

  constructor(value = false, validators: Validator<boolean>[] = []) {
    super(value, validators)

    this.toggle = this.toggle.bind(this)
    this.open = this.open.bind(this)
    this.close = this.close.bind(this)

    makeObservable(this, {
      isOpen: computed,
      isDisabled: observable,
    })
  }

  get isOpen(): boolean {
    return this.value
  }

  toggle(): void {
    this.change(!this.value)
  }

  open(): void {
    this.change(true)
  }

  close(): void {
    this.change(false)
  }
}
