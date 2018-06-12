// @flow

import Form, {fieldListsIncludes} from "./Form"
import type {
  Values,
  FormErrorProcessed,
  ResolvedSubmit,
  RunningSubmit,
  SubmitResult,
  FormError,
  AsyncValidationRequest,
  FieldList,
  FieldIdentifier,
  AsyncValidationStatus,
} from "./types"

export default class FormAPI<V, SM, EM> {
  _form: Form<V, SM, EM>

  constructor(form: Form<V, SM, EM>) {
    this._form = form
  }

  reinitialize: (initialValues?: Values<V>) => void = initialValues => {
    // TODO
  }

  getTimeCurrent: () => number = () => {
    return this._form._getTime()
  }

  getTimeInitialization: () => number = () => {
    return this._form.state.initializationTime
  }

  getTimeResolvedSubmit: () => number | null = () => {
    const submit = this._form.state.resolvedSubmit
    return submit && submit.startTime
  }

  getTimeLatestSubmit: () => number | null = () => {
    const submit =
      this._form.state.runningSubmit || this._form.state.resolvedSubmit
    return submit && submit.startTime
  }

  getTimeAsyncValidationRequested: (fieldName: FieldIdentifier) => number | null // TODO

  getTimeValueUpdate: (fieldName?: string) => number = fieldName => {
    if (fieldName === undefined) {
      // TODO: return time of the latest update of any field
      return 0
    }
    return this._form._getValueUpdateTime(fieldName)
  }

  createValuesSnapshot: () => number = () => {
    this._form.setState(this._form._persistCurrentValues())
    return this.getTimeCurrent()
  }

  getValue: (fieldName: string, time: number | void | null) => V | void = (
    fieldName,
    time,
  ) => {
    return this._form._getValue(fieldName, time !== null ? time : undefined)
  }

  getAllValues: (time: number | void | null) => Values<V> = time => {
    return this._form._getValues(time !== null ? time : undefined)
  }

  setValue: (fieldName: string, newValue: V) => void = (
    fieldName,
    newValue,
  ) => {
    return this._form._setValue(fieldName, newValue)
  }

  getFieldsUpdatedSince: (
    time: number | void | null,
  ) => $ReadOnlyArray<string> = time => {
    if (time === null || time === undefined) {
      return []
    }

    const result = []

    this._form.state.values.forEach(snapshot => {
      if (snapshot.time > time && !result.includes(snapshot.fieldName)) {
        result.push(snapshot.fieldName)
      }
    })

    return result
  }

  // TODO: return Promise<isCancelled>
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

  // "finished"?
  getResolvedSubmit: () => ResolvedSubmit<SM, EM> | null = () => {
    return this._form.state.resolvedSubmit
  }

  setTouched: (fieldName: string) => void = (fieldName, isTouched) => {
    this._form._setTouched(fieldName)
  }

  isTouched: (fieldName: string) => boolean = fieldName => {
    return this._form.state.touchedFields.includes(fieldName)
  }

  getTouchedFields: () => $ReadOnlyArray<string> = () => {
    return this._form.state.touchedFields
  }

  getErrors: (
    fieldName: FieldIdentifier | void | null,
    includeOutdated?: boolean,
  ) => $ReadOnlyArray<FormErrorProcessed<EM>> = (
    fieldName,
    includeOutdated,
  ) => {
    const errors = this._form._getAllErrors()
    const errors1 = Boolean(includeOutdated)
      ? errors
      : errors.filter(error => !error.isOutdated)
    return fieldName === null || fieldName === undefined
      ? errors1
      : errors1.filter(error => fieldListsIncludes(error.fieldNames, fieldName))
  }

  getKnownFieldNames: () => $ReadOnlyArray<string> = () => {
    return Object.keys(this.getAllValues())
  }

  requestAsyncValidation: (
    validationKind: string,
    applyToFields: FieldList,
  ) => void = (validationKind, applyToFields) => {
    this._form._requestAsyncValidation(validationKind, applyToFields)
  }

  /** NEW idea */
  getAsyncValidationStatus: (
    validationKind: string,
    applyToFields: FieldList,
  ) => AsyncValidationStatus<EM> | null // TODO

  getAllAsyncValidationStatuses: () => Array<AsyncValidationStatus<EM>> // TODO

  cancelAsyncValidation: (
    validationKind: string,
    applyToFields: FieldList,
  ) => void // TODO
  /** NEW idea */

  // TODO: return Promise<isCancelled>
  // TODO?:
  //   should result promise also wait for running related validations?
  //   what about ones that spawn a bit later?
  //
  // maybe take requests as argument?
  // then it could be used in combination with getPendingAsyncValidationRequests
  //
  // we wouldn't be able to wait for running related validations then,
  // but we could have another method for that
  //
  // although then we'll have a method accepting fieldName again
  runAsyncValidations: (
    fieldName?: FieldIdentifier,
  ) => Promise<void> = fieldName => {
    if (fieldName === undefined) {
      // TODO: run all requested validations
      return Promise.resolve()
    }
    return this._form._performAsyncValidations(fieldName)
  }

  // TODO?: fieldName optional
  // TODO?: getPendingAsyncValidationRequests
  isAsyncValidationPending: (
    fieldName: FieldIdentifier,
  ) => boolean = fieldName => {
    return this._form.state.pendingValidationRequests.some(request =>
      fieldListsIncludes(request.applyToFields, fieldName),
    )
  }

  // TODO?: fieldName optional
  // TODO?: getRunningAsyncValidationRequests
  // TODO?: then also getFinishedAsyncValidationRequests
  isAsyncValidationRunning: (
    fieldName: FieldIdentifier,
  ) => boolean = fieldName => {
    return this._form.state.runningValidationRequests.some(request =>
      fieldListsIncludes(request.applyToFields, fieldName),
    )
  }

  // TODO: direct access to validation requests of all statuses?
  // TODO: cancelValidation
  // TODO: initialValidationRequests prop?
}
