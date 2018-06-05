// @flow

import getTime from "./getTime"
import Form from "./Form"
import type {
  Values,
  FormErrorProcessed,
  ResolvedSubmit,
  Time,
  RunningSubmit,
  SubmitResult,
  FormError,
  AsyncValidationRequest,
} from "./types"

export default class FormAPI<V, SM, EM> {
  _form: Form<V, SM, EM>

  constructor(form: Form<V, SM, EM>) {
    this._form = form
  }

  getInitialValues: () => Values<V> = () => {
    return this._form._getValues(this._form.state.initializationTime)
  }

  reinitialize: (initialValues?: Values<V>) => void = initialValues => {
    // TODO
  }

  getInitializationTime: () => Time = () => {
    return this._form.state.initializationTime
  }

  getValue: (fieldName: string) => V | void = fieldName => {
    return this._form._getValue(fieldName)
  }

  getAllValues: () => Values<V> = () => {
    return this._form._getValues()
  }

  setValue: (fieldName: string, newValue: V) => void = (
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

  getRunningSubmit: () => RunningSubmit | null = () => {
    return this._form.state.runningSubmit
  }

  getResolvedSubmit: () => ResolvedSubmit<SM, EM> | null = () => {
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

  isAnyTouched: () => boolean = () => {
    return this._form.state.touchedFields.length > 0
  }

  getErrors: (
    fieldName: string,
    includeOutdated?: boolean,
  ) => $ReadOnlyArray<FormErrorProcessed<V, EM>> = (
    fieldName,
    includeOutdated,
  ) => {
    return this._form
      ._getAllErrors(Boolean(includeOutdated))
      .filter(
        error =>
          error.fieldNames !== "unknown" &&
          error.fieldNames.includes(fieldName),
      )
  }

  getUnknownFieldErrors: (
    includeOutdated?: boolean,
  ) => $ReadOnlyArray<FormErrorProcessed<V, EM>> = includeOutdated => {
    return this._form
      ._getAllErrors(Boolean(includeOutdated))
      .filter(error => error.fieldNames === "unknown")
  }

  getAllErrors: (
    includeOutdated?: boolean,
  ) => $ReadOnlyArray<FormErrorProcessed<V, EM>> = includeOutdated => {
    return this._form._getAllErrors(Boolean(includeOutdated))
  }

  getKnownFieldNames: () => $ReadOnlyArray<string> = () => {
    return Object.keys(this.getAllValues())
  }

  requestAsyncValidation: (
    validationKind: string,
    fieldNames: $ReadOnlyArray<string> | "unknown",
  ) => void = (validationKind, fieldNames) => {
    this._form._requestAsyncValidation(validationKind, fieldNames)
  }

  // TODO: return Promise<isCancelled>
  // TODO: a way to perform validation for 'unknown' fields
  performAsyncValidations: (fieldName: string) => Promise<void> = fieldName => {
    return this._form._performAsyncValidations(fieldName)
  }

  isAwaitingValidation: (fieldName: string) => boolean = fieldName => {
    return this._form.state.pendingValidationRequests.some(
      request =>
        request.fieldNames !== "all" && request.fieldNames.includes(fieldName),
    )
  }

  isValidating: (fieldName: string) => boolean = fieldName => {
    return this._form.state.runningValidationRequests.some(
      request =>
        request.fieldNames !== "all" && request.fieldNames.includes(fieldName),
    )
  }

  hasChangedSinceSubmit: (fieldName: string) => boolean = fieldName => {
    const {resolvedSubmit} = this._form.state

    if (resolvedSubmit === null) {
      return false
    }

    return this._form.state.values.some(
      snapshot =>
        snapshot.fieldName === fieldName &&
        snapshot.time.count > resolvedSubmit.startTime.count,
    )
  }

  hasChangedSinceInitialization: (fieldName: string) => boolean = fieldName => {
    return this._form.state.values.some(
      snapshot =>
        snapshot.fieldName === fieldName &&
        snapshot.time.count > this._form.state.initializationTime.count,
    )
  }
}
