export type ValidatorResult = string | null

export type Validator<T> = (value: T) => ValidatorResult
