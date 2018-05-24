// @flow

import getTime from "./getTime"
import Form from "./Form"
import type {
  Values,
  FormErrorProcessed,
  ResolvedSubmit,
  Time,
  PendingSubmit,
} from "./types"

export default class FormAPI<Value, SubmitMeta, ErrorMeta> {
  _form: Form<Value, SubmitMeta, ErrorMeta>

  constructor(form: Form<Value, SubmitMeta, ErrorMeta>) {
    this._form = form
  }

  getInitialValues = (): Values<Value> => {
    // TODO
    return {}
  }

  reinitialize = (initialValues?: Values<Value>): void => {
    // TODO
  }

  getInitializationTime = (): Time => {
    // TODO
    return {time: 0, count: 0}
  }

  getValue = (fieldName: string): Value | void => {
    return this._form.getValues()[fieldName]
  }

  getAllValues = (): Values<Value> => {
    return this._form.getValues()
  }

  setValue = (fieldName: string, newValue: Value): void => {
    return this._form.setValue(fieldName, newValue)
  }

  getFieldUpdateTime = (fieldName: string): Time => {
    // TODO
    return {time: 0, count: 0}
  }

  submit = (e?: Event): void => {
    if (e) {
      e.preventDefault()
    }
    return this._form.submit()
  }

  cancelSubmit = (): void => {
    // TODO
  }

  getPendingSubmit = (): PendingSubmit<Value> | null => {
    // TODO
    return null
  }

  getResolvedSubmit = (): ResolvedSubmit<
    Value,
    SubmitMeta,
    ErrorMeta,
  > | null => {
    // TODO
    return null
  }

  setTouched = (fieldName: string, isTouched: boolean): void => {
    // TODO
  }

  isTouched = (fieldName: string): boolean | void => {
    // TODO
  }

  getErrors = (
    fieldName: string | null,
    includeOutdated?: boolean,
  ): $ReadOnlyArray<FormErrorProcessed<Value, ErrorMeta>> => {
    return this._form.getErrors({field: fieldName, includeOutdated})
  }

  getAllErrors = (
    includeOutdated?: boolean,
  ): $ReadOnlyArray<FormErrorProcessed<Value, ErrorMeta>> => {
    return this._form.getErrors({includeOutdated})
  }

  validate = (validatorId: string, cb?: () => void): void => {
    // TODO
  }

  validateAll = (
    cb?: (() => void) | null,
    includeUpToDate?: boolean,
  ): $ReadOnlyArray<string> => {
    // TODO
    return []
  }

  isValidating = (validatorId: string): boolean => {
    // TODO
    return false
  }

  cancelValidation = (validatorId: string): void => {
    // TODO
  }

  hasChangedSinceSubmit = (fieldName: string): boolean => {
    // TODO
    return false
  }

  getFieldsChangedSinceSubmit = (): $ReadOnlyArray<string> => {
    // TODO
    return []
  }

  hasChangedSinceValidation = (
    fieldName: string,
    validatorId: string,
  ): boolean => {
    // TODO
    return false
  }

  getFieldsChangedSinceValidation = (
    validatorId?: string,
  ): $ReadOnlyArray<string> => {
    // TODO
    return []
  }

  hasChangedSinceInitialization = (fieldName: string): boolean => {
    // TODO
    return false
  }

  getFieldsChangedSinceInitialization = (): $ReadOnlyArray<string> => {
    // TODO
    return []
  }
}
