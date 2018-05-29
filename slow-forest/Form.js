// @flow

import * as React from "react"
import getTime from "./getTime"
import FormAPI from "./FormApi"
import type {
  Time,
  Values,
  SubmitHandler,
  PendingSubmit,
  ResolvedSubmit,
  Validator,
  FormErrorProcessed,
  FormError,
  ErrorSource,
  PendingValidation,
  ResolvedValidation,
} from "./types"
import {CancellationSourceShim} from "./cancellation"

type Props<Value, SubmitMeta, ErrorMeta> = {|
  render: (FormAPI<Value, SubmitMeta, ErrorMeta>) => React.Node,
  initialValues?: Values<Value>,
  submitHandler?: SubmitHandler<Value, SubmitMeta, ErrorMeta>,
  afterSubmit?: (FormAPI<Value, SubmitMeta, ErrorMeta>) => void,
  validators?: $ReadOnlyArray<Validator<Value, ErrorMeta>>,
  hasValueChanged?: (
    fieldName: string,
    oldSnapshot: $ReadOnly<{|value: Value, time: Time|}>,
    newSnapshot: $ReadOnly<{|value: Value, time: Time|}>,
  ) => boolean,
|}

type State<Value, SubmitMeta, ErrorMeta> = {|
  initialValues: Values<Value>,
  initializationTime: Time,
  currentValues: Values<Value>,
  fieldUpdateTime: Values<Time>,
  isTouched: Values<boolean>,
  pendingSubmit: PendingSubmit<Value> | null,
  resolvedSubmit: ResolvedSubmit<Value, SubmitMeta, ErrorMeta> | null,
  errors: $ReadOnlyArray<FormErrorProcessed<Value, ErrorMeta>>,
  pendingValidations: $ReadOnly<{[string]: PendingValidation<Value> | void}>,
  resolvedValidations: $ReadOnly<{
    [string]: ResolvedValidation<Value, ErrorMeta> | void,
  }>,
|}

export default class Form<Value, SubmitMeta, ErrorMeta> extends React.Component<
  Props<Value, SubmitMeta, ErrorMeta>,
  State<Value, SubmitMeta, ErrorMeta>,
> {
  api: FormAPI<Value, SubmitMeta, ErrorMeta>
  state: State<Value, SubmitMeta, ErrorMeta>
  _submitCancellationSource: CancellationSourceShim | null
  _validationCancellationSources: {
    [string]: CancellationSourceShim | void,
  }

  constructor(props: Props<Value, SubmitMeta, ErrorMeta>) {
    super(props)
    const initialValues = props.initialValues || {}
    const validators = props.validators || []

    const time = getTime()

    const state = {
      initialValues,
      initializationTime: time,
      currentValues: initialValues,
      fieldUpdateTime: {},
      isTouched: {},
      pendingSubmit: null,
      resolvedSubmit: null,
      pendingValidations: {},
      resolvedValidations: {},
      errors: [],
    }

    this.state = {
      ...state,
      ...this._runSynchronousValidators(state),
    }

    this.api = new FormAPI(this)
    this._submitCancellationSource = null
    this._validationCancellationSources = {}
  }

  _processError(
    error: FormError<ErrorMeta>,
    time: Time,
    values: Values<Value>,
    source: ErrorSource,
  ): FormErrorProcessed<Value, ErrorMeta> {
    const {fieldName} = error
    return {
      ...error,
      source,
      valueSnapshot:
        fieldName === null
          ? {time, fieldName, values}
          : {time, fieldName, value: values[fieldName]},
    }
  }

  _hasValueChanged(
    fieldName: string,
    oldTime: Time,
    newTime: Time,
    oldValue: Value,
    newValue: Value,
  ): boolean {
    const {hasValueChanged} = this.props

    if (hasValueChanged === undefined) {
      return oldTime.count < newTime.count
    }

    return hasValueChanged(
      fieldName,
      {time: oldTime, value: oldValue},
      {time: newTime, value: newValue},
    )
  }

  _afterSubmit = (): void => {
    const {afterSubmit} = this.props
    if (afterSubmit) {
      afterSubmit(this.api)
    }
  }

  _updateErrorsForValidator(
    currentErrors: $ReadOnlyArray<FormErrorProcessed<Value, ErrorMeta>>,
    newErrors: $ReadOnlyArray<FormError<ErrorMeta>>,
    validator: Validator<Value, ErrorMeta>,
    validationTime: Time,
    validatedValues: Values<Value>,
  ): $ReadOnlyArray<FormErrorProcessed<Value, ErrorMeta>> {
    return [
      ...currentErrors.filter(
        e => e.source.type !== "validator" || e.source.id !== validator.id,
      ),
      ...newErrors.map(error =>
        this._processError(error, validationTime, validatedValues, {
          type: "validator",
          id: validator.id,
        }),
      ),
    ]
  }

  _isValidatorRelatedToField(
    validator: Validator<Value, ErrorMeta>,
    fieldName: string,
  ): boolean {
    if (validator.fields === null) {
      return true
    }

    if (Array.isArray(validator.fields)) {
      return validator.fields.includes(fieldName)
    }

    return validator.fields(fieldName)
  }

  runValidator(validatorId: string): Promise<void> {
    const validator = (this.props.validators || []).find(
      validator => validator.id === validatorId,
    )

    if (validator === undefined) {
      throw new Error("TODO: error message")
    }

    if (validator.tag === "synchronous") {
      return new Promise(resolve => {
        this.setState(
          this._runSynchronousValidators(this.state, undefined, validatorId),
          resolve,
        )
      })
    }

    const {currentValues, pendingValidations} = this.state

    if (this._validationCancellationSources[validatorId] !== undefined) {
      this._validationCancellationSources[validatorId].cancel()
      this._validationCancellationSources[validatorId] = undefined
    }

    const startTime = getTime()

    this.setState({
      pendingValidations: {
        ...pendingValidations,
        [validatorId]: {startTime, values: currentValues},
      },
    })

    const cancellationSource = (this._validationCancellationSources[
      validatorId
    ] = new CancellationSourceShim())

    const validatorFunction = validator.validator

    return validatorFunction(currentValues, cancellationSource.token).then(
      newErrors => {
        const {pendingValidations, resolvedValidations, errors} = this.state

        const pendingValidation = pendingValidations[validatorId]
        if (
          pendingValidation === undefined ||
          pendingValidation.startTime.count !== startTime.count
        ) {
          return
        }

        const cancellationSource = this._validationCancellationSources[
          validatorId
        ]

        // Can't happen, we need this check only for Flow
        if (cancellationSource === undefined) {
          throw new Error("TODO: error message")
        }

        cancellationSource.close()
        this._validationCancellationSources[validatorId] = undefined

        // Promised resolved to undefined although submit wasn't canceled
        if (newErrors === undefined) {
          this.setState({
            pendingValidations: {
              ...pendingValidations,
              [validatorId]: undefined,
            },
          })
          throw new TypeError("TODO: error message")
        }

        this.setState({
          pendingValidations: {
            ...pendingValidations,
            [validatorId]: undefined,
          },
          resolvedValidations: {
            ...resolvedValidations,
            [validatorId]: {
              ...pendingValidation,
              endTime: getTime(),
              errors: newErrors,
            },
          },
          errors: this._updateErrorsForValidator(
            errors,
            newErrors,
            validator,
            pendingValidation.startTime,
            pendingValidation.values,
          ),
        })
      },
    )
  }

  submit(): Promise<void> {
    const {submitHandler} = this.props
    const {currentValues, pendingSubmit} = this.state

    if (!submitHandler) {
      return Promise.resolve()
    }

    if (this._submitCancellationSource !== null) {
      this._submitCancellationSource.cancel()
      this._submitCancellationSource = null
    }

    const startTime = getTime()

    this.setState({pendingSubmit: {startTime, values: currentValues}})

    this._submitCancellationSource = new CancellationSourceShim()
    return submitHandler(this.api, this._submitCancellationSource.token).then(
      result => {
        const {pendingSubmit, resolvedSubmit, errors} = this.state

        if (
          pendingSubmit === null ||
          pendingSubmit.startTime.count !== startTime.count
        ) {
          return
        }

        // Can't happen, we need this check only for Flow
        if (this._submitCancellationSource === null) {
          throw new Error("TODO: error message")
        }

        this._submitCancellationSource.close()
        this._submitCancellationSource = null

        // Promised resolved to undefined although submit wasn't canceled
        if (result === undefined) {
          this.setState({pendingSubmit: null})
          throw new TypeError("TODO: error message")
        }

        this.setState(
          {
            pendingSubmit: null,
            resolvedSubmit: {
              ...pendingSubmit,
              endTime: getTime(),
              result,
            },
            errors: errors.filter(e => e.source !== "submit").concat(
              result.errors.map(error =>
                this._processError(
                  error,
                  pendingSubmit.startTime,
                  pendingSubmit.values,
                  {
                    type: "submit",
                  },
                ),
              ),
            ),
          },
          this._afterSubmit,
        )
      },
    )
  }

  getValues(): Values<Value> {
    return this.state.currentValues
  }

  _runSynchronousValidators(
    state: State<Value, SubmitMeta, ErrorMeta>,
    fieldName?: string,
    validatorId?: string,
  ): $Shape<State<Value, SubmitMeta, ErrorMeta>> {
    const {currentValues, errors} = state
    const time = getTime()
    const validators = this.props.validators || []
    return {
      // TODO: resolvedValidations
      errors: validators.reduce((errors, validator) => {
        if (validator.tag === "asynchronous") {
          return errors
        }
        if (
          fieldName !== undefined &&
          !this._isValidatorRelatedToField(validator, fieldName)
        ) {
          return errors
        }
        if (validatorId !== undefined && validator.id === validatorId) {
          return errors
        }
        return this._updateErrorsForValidator(
          errors,
          validator.validator(currentValues),
          validator,
          time,
          currentValues,
        )
      }, errors),
    }
  }

  setValue(fieldName: string, newValue: Value): void {
    return this.setState(state => {
      const time = getTime()
      const currentValues = {...state.currentValues, [fieldName]: newValue}
      const fieldUpdateTime = {...state.fieldUpdateTime, [fieldName]: time}
      return {
        currentValues,
        fieldUpdateTime,
        ...this._runSynchronousValidators({...state, currentValues}, fieldName),
      }
    })
  }

  setTouched(fieldName: string, isTouched: boolean): void {
    this.setState({
      isTouched: {...this.state.isTouched, [fieldName]: isTouched},
    })
  }

  getFieldUpdateTime(fieldName: string): Time {
    return (
      this.state.fieldUpdateTime[fieldName] || this.state.initializationTime
    )
  }

  isErrorOutdated(error: FormErrorProcessed<Value, ErrorMeta>): boolean {
    const {valueSnapshot} = error
    const {currentValues} = this.state

    if (valueSnapshot.fieldName === null) {
      return Object.keys(currentValues).some(fieldName =>
        this._hasValueChanged(
          fieldName,
          valueSnapshot.time,
          this.getFieldUpdateTime(fieldName),
          valueSnapshot.values[fieldName],
          currentValues[fieldName],
        ),
      )
    }

    return this._hasValueChanged(
      valueSnapshot.fieldName,
      valueSnapshot.time,
      this.getFieldUpdateTime(valueSnapshot.fieldName),
      valueSnapshot.value,
      currentValues[valueSnapshot.fieldName],
    )
  }

  getErrors(
    fieldName: string | null | void,
    includeOutdated: boolean,
  ): $ReadOnlyArray<FormErrorProcessed<Value, ErrorMeta>> {
    const {errors} = this.state

    return errors.filter(error => {
      if (fieldName !== undefined && error.fieldName !== fieldName) {
        return false
      }
      if (!includeOutdated && this.isErrorOutdated(error)) {
        return false
      }
      return true
    })
  }

  render() {
    return (
      <div>
        {this.props.render(this.api)}
        <hr />
        <pre>{JSON.stringify(this.state, null, 2)}</pre>
      </div>
    )
  }
}
