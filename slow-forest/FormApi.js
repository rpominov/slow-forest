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
} from "./types"

export default class FormAPI<V, SM, EM> {
  _form: Form<V, SM, EM>

  constructor(form: Form<V, SM, EM>) {
    this._form = form
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

  reinitialize: (initialValues?: Values<V>) => void = initialValues => {
    // TODO
  }

  persistValues: () => number = () => {
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

  // TODO: make fieldName optional and allow to get time of any latest update?
  // in any case make sure it's consistent with isTouched/isAllTouched
  getUpdateTime: (fieldName: string) => number = fieldName => {
    return this._form._getValueUpdateTime(fieldName)
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

  getResolvedSubmit: () => ResolvedSubmit<SM, EM> | null = () => {
    return this._form.state.resolvedSubmit
  }

  setTouched: (fieldName: string) => void = (fieldName, isTouched) => {
    this._form._setTouched(fieldName, true)
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
    const errors = this._form._getAllErrors(Boolean(includeOutdated))
    return fieldName === null || fieldName === undefined
      ? errors
      : errors.filter(error => fieldListsIncludes(error.fieldNames, fieldName))
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

  // TODO: return Promise<isCancelled>
  // TODO: make fieldName optional and allow to run all validations? usefull before submit
  //
  // should result promise also wait for running related validations (that we didn't cancel)?
  // what about ones that may spawn a bit later?
  performAsyncValidations: (
    fieldName: FieldIdentifier,
  ) => Promise<void> = fieldName => {
    return this._form._performAsyncValidations(fieldName)
  }

  // TODO: a way to get time when field started to wait for validation
  // (e.g. last time when it was validated)
  isAwaitingValidation: (fieldName: FieldIdentifier) => boolean = fieldName => {
    return this._form.state.pendingValidationRequests.some(request =>
      fieldListsIncludes(request.applyToFields, fieldName),
    )
  }

  isValidating: (fieldName: FieldIdentifier) => boolean = fieldName => {
    return this._form.state.runningValidationRequests.some(request =>
      fieldListsIncludes(request.applyToFields, fieldName),
    )
  }

  // TODO: direct access to validation requests of all statuses?
  // TODO: initialValidationRequests prop?
}
