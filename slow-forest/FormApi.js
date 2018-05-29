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
  PendingValidation,
  ResolvedValidation,
} from "./types"

export default class FormAPI<Value, SubmitMeta, ErrorMeta> {
  _form: Form<Value, SubmitMeta, ErrorMeta>

  constructor(form: Form<Value, SubmitMeta, ErrorMeta>) {
    this._form = form
  }

  getInitialValues: () => Values<Value> = () => {
    return this._form.state.initialValues
  }

  reinitialize: (initialValues?: Values<Value>) => void = initialValues => {
    // TODO
  }

  getInitializationTime: () => Time = () => {
    return this._form.state.initializationTime
  }

  getValue: (fieldName: string) => Value | void = fieldName => {
    return this._form.getValues()[fieldName]
  }

  getAllValues: () => Values<Value> = () => {
    return this._form.getValues()
  }

  setValue: (fieldName: string, newValue: Value) => void = (
    fieldName,
    newValue,
  ) => {
    return this._form.setValue(fieldName, newValue)
  }

  getFieldUpdateTime: (fieldName: string) => Time = fieldName => {
    return this._form.getFieldUpdateTime(fieldName)
  }

  createSubmitResult: (
    errors: $ReadOnlyArray<FormError<ErrorMeta>> | void,
    meta: SubmitMeta,
  ) => SubmitResult<SubmitMeta, ErrorMeta> = (errors, meta) => {
    return {errors: errors === undefined ? [] : errors, meta}
  }

  submit: (event?: Event) => Promise<void> = event => {
    if (event) {
      event.preventDefault()
    }
    return this._form.submit()
  }

  cancelSubmit: () => void = () => {
    // TODO
  }

  getPendingSubmit: () => PendingSubmit<Value> | null = () => {
    return this._form.state.pendingSubmit
  }

  getResolvedSubmit: () => ResolvedSubmit<
    Value,
    SubmitMeta,
    ErrorMeta,
  > | null = () => {
    return this._form.state.resolvedSubmit
  }

  setTouched: (fieldName: string, isTouched: boolean) => void = (
    fieldName,
    isTouched,
  ) => {
    this._form.setTouched(fieldName, isTouched)
  }

  isTouched: (fieldName: string) => boolean = fieldName => {
    return Boolean(this._form.state.isTouched[fieldName])
  }

  getErrors: (
    fieldName: string | null,
    includeOutdated?: boolean,
  ) => $ReadOnlyArray<FormErrorProcessed<Value, ErrorMeta>> = (
    fieldName,
    includeOutdated,
  ) => {
    return this._form.getErrors(fieldName, Boolean(includeOutdated))
  }

  getAllErrors: (
    includeOutdated?: boolean,
  ) => $ReadOnlyArray<
    FormErrorProcessed<Value, ErrorMeta>,
  > = includeOutdated => {
    return this._form.getErrors(undefined, Boolean(includeOutdated))
  }

  getFieldNames: () => $ReadOnlyArray<string> = () => {
    return Object.keys(this.getAllValues())
  }

  getValidators: () => $ReadOnlyArray<string> = () => {
    // TODO
    return []
  }

  isValidated: (fieldName: string) => boolean = fieldName => {
    return this.getValidators().some(
      v =>
        this.isValidatorRelatedToField(v, fieldName) &&
        this.shouldRunValidator(v),
    )
  }

  isValidating: (fieldName: string) => boolean = fieldName => {
    return this.getValidators().some(
      v =>
        this.isValidatorRelatedToField(v, fieldName) &&
        this.getPendingValidatorRun(v) !== null,
    )
  }

  validate: (fieldName: string, includeOutdated?: boolean) => Promise<void> = (
    fieldName,
    includeOutdated,
  ) => {
    return Promise.all(
      this.getValidators()
        .filter(
          v =>
            this.isValidatorRelatedToField(v, fieldName) &&
            (Boolean(includeOutdated) || this.shouldRunValidator(v)),
        )
        .map(this.runValidator),
    ).then(() => undefined)
  }

  // TODO: better method name
  getLastValidationInfoForValue: (
    fieldName: string,
  ) => $ReadOnly<{|time: Time, value: Value|}> | null = fieldName => {
    const validators = this.getValidators().filter(v =>
      this.isValidatorRelatedToField(v, fieldName),
    )

    if (validators.length === 0) {
      // TODO: return latest value/time
      return null
    }

    const validatorRunMostEarly = validators.reduce((v1, v2) => {
      const r1 = this.getResolvedValidatorRun(v1)
      const r2 = this.getResolvedValidatorRun(v2)

      if (r1 === null) {
        return v1
      }

      if (r2 === null) {
        return v2
      }

      return r1.startTime.count < r2.startTime.count ? v1 : v2
    })

    const result = this.getResolvedValidatorRun(validatorRunMostEarly)

    if (result === null) {
      return null
    }

    return {
      time: result.startTime,
      value: result.values[fieldName],
    }
  }

  shouldRunValidator: (validatorId: string) => boolean = validatorId => {
    // TODO
    return false
  }

  runValidator: (validatorId: string) => Promise<void> = validatorId => {
    // TODO
    return Promise.resolve()
  }

  cancelValidatorRun: (validatorId: string) => void = validatorId => {
    // TODO
  }

  getPendingValidatorRun: (
    validatorId: string,
  ) => PendingValidation<Value> | null = validatorId => {
    // TODO
    return null
  }

  getResolvedValidatorRun: (
    validatorId: string,
  ) => ResolvedValidation<Value, ErrorMeta> | null = validatorId => {
    // TODO
    return null
  }

  isValidatorRelatedToField: (
    validatorId: string,
    fieldName: string,
  ) => boolean = (validatorId, fieldName) => {
    // TODO
    return false
  }

  getFieldsChangedSince: (time: Time) => $ReadOnlyArray<string> = time => {
    const {fieldUpdateTime} = this._form.state
    return Object.keys(fieldUpdateTime).filter(
      k => fieldUpdateTime[k].count > time.count,
    )
  }

  hasChangedSinceSubmit: (fieldName: string) => boolean = fieldName => {
    const {resolvedSubmit} = this._form.state
    return resolvedSubmit
      ? this.getFieldsChangedSince(resolvedSubmit.startTime).includes(fieldName)
      : false
  }

  hasChangedSinceInitialization: (fieldName: string) => boolean = fieldName => {
    const {initializationTime} = this._form.state
    return this.getFieldsChangedSince(initializationTime).includes(fieldName)
  }
}
