// @flow

import getTime from "./getTime"
import Form from "./Form"
import type {
  Values,
  FormErrorProcessed,
  ResolvedSubmit,
  Time,
  PendingSubmit,
  SubmitResult,
  FormError,
  AsyncValidationRequest,
} from "./types"

export default class FormAPI<Value, SubmitMeta, ErrorMeta> {
  _form: Form<Value, SubmitMeta, ErrorMeta>

  constructor(form: Form<Value, SubmitMeta, ErrorMeta>) {
    this._form = form
  }

  getInitialValues: () => Values<Value> = () => {
    // TODO
    return {}
  }

  reinitialize: (initialValues?: Values<Value>) => void = initialValues => {
    // TODO
  }

  getInitializationTime: () => Time = () => {
    return this._form.state.initializationTime
  }

  getValue: (fieldName: string) => Value | void = fieldName => {
    return this._form._getValue(fieldName)
  }

  getAllValues: () => Values<Value> = () => {
    return this._form._getValues()
  }

  setValue: (fieldName: string, newValue: Value) => void = (
    fieldName,
    newValue,
  ) => {
    return this._form._setValue(fieldName, newValue)
  }

  getValueUpdateTime: (fieldName: string) => Time = fieldName => {
    return this._form._getValueUpdateTime(fieldName)
  }

  // TODO: return Promise<isCancelled> instead of Promise<void>
  submit: (event?: Event) => Promise<void> = event => {
    if (event) {
      event.preventDefault()
    }
    return this._form._submit()
  }

  cancelSubmit: () => void = () => {
    return this._form._cancelSubmit()
  }

  getPendingSubmit: () => PendingSubmit | null = () => {
    return this._form.state.pendingSubmit
  }

  getResolvedSubmit: () => ResolvedSubmit<
    SubmitMeta,
    ErrorMeta,
  > | null = () => {
    return this._form.state.resolvedSubmit
  }

  setTouched: (fieldName: string, isTouched: boolean) => void = (
    fieldName,
    isTouched,
  ) => {
    this._form._setTouched(fieldName, isTouched)
  }

  isTouched: (fieldName: string) => boolean = fieldName => {
    return this._form.state.touchedFields.includes(fieldName)
  }

  getErrors: (
    fieldName: string | null,
    includeOutdated?: boolean,
  ) => $ReadOnlyArray<FormErrorProcessed<Value, ErrorMeta>> = (
    fieldName,
    includeOutdated,
  ) => {
    // TODO
    return []
  }

  getAllErrors: (
    includeOutdated?: boolean,
  ) => $ReadOnlyArray<
    FormErrorProcessed<Value, ErrorMeta>,
  > = includeOutdated => {
    // TODO
    return []
  }

  getKnownFieldNames: () => $ReadOnlyArray<string> = () => {
    return Object.keys(this.getAllValues())
  }

  requestAsyncValidation: (
    validationKind: string,
    fieldNames: $ReadOnlyArray<string> | "all",
  ) => void // TODO

  getAsyncValidationRequests: () => $ReadOnlyArray<
    AsyncValidationRequest<ErrorMeta>,
  > // TODO

  performAsyncValidations: (fieldName: string) => Promise<boolean> // TODO
  isAwaitingValidation: (fieldName: string) => boolean // TODO
  isValidating: (fieldName: string) => boolean // TODO

  hasChangedSinceSubmit: (fieldName: string) => boolean = fieldName => {
    // TODO
    return false
  }

  hasChangedSinceInitialization: (fieldName: string) => boolean = fieldName => {
    // TODO
    return false
  }
}
