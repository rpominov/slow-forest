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

  getValue: (fieldName: string) => Value = fieldName => {
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

  getValueUpdateTime: (fieldName: string) => Time = fieldName => {
    return this._form.getValueUpdateTime(fieldName)
  }

  // TODO: return Promise<isCancelled> instead of Promise<void>
  submit: (event?: Event) => Promise<void> = event => {
    if (event) {
      event.preventDefault()
    }
    return this._form.submit()
  }

  cancelSubmit: () => void = () => {
    return this._form.cancelSubmit()
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
    return (this._form.props.validators || []).map(v => v.id)
  }

  isValidated: (fieldName: string) => boolean = fieldName => {
    const snapshot = this.getLastValidatedValueSnapshot(fieldName)

    // TODO: what if validator checks two values and other have changed?
    // waht if a error related to two fields and we are looking at field A, while B has changed?
    return snapshot === null
      ? true
      : this._form._hasValueChanged(
          fieldName,
          snapshot.time,
          this.getValueUpdateTime(fieldName),
          snapshot.value,
          this.getValue(fieldName),
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

  // TODO: better name
  getLastValidatedValueSnapshot: (
    fieldName: string,
  ) => $ReadOnly<{|time: Time, value: Value|}> | null = fieldName => {
    const validators = this.getValidators().filter(v =>
      this.isValidatorRelatedToField(v, fieldName),
    )

    if (validators.length === 0) {
      return {
        time: this.getValueUpdateTime(fieldName),
        value: this.getValue(fieldName),
      }
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
    const resolvedRun = this.getResolvedValidatorRun(validatorId)

    if (resolvedRun === null) {
      return true
    }

    return this.getFieldNames().some(
      fieldName =>
        this.isValidatorRelatedToField(validatorId, fieldName) &&
        this._form._hasValueChanged(
          fieldName,
          resolvedRun.startTime,
          this.getValueUpdateTime(fieldName),
          resolvedRun.values[fieldName],
          this.getValue(fieldName),
        ),
    )
  }

  runValidator: (validatorId: string) => Promise<void> = validatorId => {
    return this._form.runValidator(validatorId)
  }

  cancelValidatorRun: (validatorId: string) => void = validatorId => {
    // TODO
  }

  getPendingValidatorRun: (
    validatorId: string,
  ) => PendingValidation<Value> | null = validatorId => {
    return this._form.state.pendingValidations[validatorId] || null
  }

  getResolvedValidatorRun: (
    validatorId: string,
  ) => ResolvedValidation<Value, ErrorMeta> | null = validatorId => {
    return this._form.state.resolvedValidations[validatorId] || null
  }

  // TODO: better name
  isValidatorRelatedToField: (
    validatorId: string,
    fieldName: string,
  ) => boolean = (validatorId, fieldName) => {
    const validator = (this._form.props.validators || []).find(
      v => v.id === validatorId,
    )
    if (validator === undefined) {
      throw new Error("TODO: error message")
    }
    return this._form.isValidatorRelatedToField(validator, fieldName)
  }

  hasChangedSinceSubmit: (fieldName: string) => boolean = fieldName => {
    const {resolvedSubmit} = this._form.state
    return resolvedSubmit
      ? this._form._hasValueChanged(
          fieldName,
          resolvedSubmit.startTime,
          this.getValueUpdateTime(fieldName),
          resolvedSubmit.values[fieldName],
          this.getValue(fieldName),
        )
      : false
  }

  hasChangedSinceInitialization: (fieldName: string) => boolean = fieldName => {
    return this._form._hasValueChanged(
      fieldName,
      this.getInitializationTime(),
      this.getValueUpdateTime(fieldName),
      this.getInitialValues()[fieldName],
      this.getValue(fieldName),
    )
  }
}
