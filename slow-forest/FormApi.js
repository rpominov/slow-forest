// @flow

import getTime from "./getTime"
import Form from "./Form"
import type {Canceler, UnresolvedSubmit, ResolvedSubmit} from "./types"

export default class FormAPI<Value, SubmitMeta, ErrorMeta> {
  _form: Form<Value, SubmitMeta, ErrorMeta>
  _cancelSubmit: Canceler

  constructor(form: Form<Value, SubmitMeta, ErrorMeta>) {
    this._form = form
  }

  submitEventHandler = (e: Event): void => {
    e.preventDefault()
    this.submit()
  }

  submit = (): void => {
    const {submitHandler} = this._form.props
    const {currentValues, pendingSubmit} = this._form.state

    if (!submitHandler) {
      return
    }

    if (pendingSubmit !== null) {
      if (this._cancelSubmit) {
        this._cancelSubmit()
      }
      this._cancelSubmit = null
    }

    const startTime = getTime()

    this._form.setState({pendingSubmit: {startTime}})

    this._cancelSubmit = submitHandler(currentValues, (result, afterSubmit) => {
      this._cancelSubmit = null

      const {pendingSubmit, lastResolvedSubmit, errors} = this._form.state

      // ignore invalid calls to submit callback
      if (
        pendingSubmit === null ||
        pendingSubmit.startTime.count !== startTime.count
      ) {
        return
      }

      const notSubmitErrors = errors.filter(e => e.source !== "submit")

      const newErrors =
        result.tag === "success"
          ? notSubmitErrors
          : notSubmitErrors.concat(
              result.errors.map(common => ({
                source: "submit",
                time: pendingSubmit.startTime,
                common,
              })),
            )

      const newState = {
        pendingSubmit: null,
        lastResolvedSubmit: {
          startTime: pendingSubmit.startTime,
          endTime: getTime(),
          result,
        },
        errors: newErrors,
      }

      this._form.setState(newState, afterSubmit)
    })
  }

  getValue = (name: string): Value => {
    return this._form.state.currentValues[name]
  }

  setValue = (name: string, newValue: Value): void => {
    const validators = this._form.props.validators || []
    function updater(state) {
      const newValues = {...state.currentValues, [name]: newValue}
      const time = getTime()

      const newErrors = validators.reduce((errors, validator) => {
        if (validator.tag === "asynchronous") {
          return errors
        }
        if (
          validator.fields !== null &&
          (!Array.isArray(validator.fields) ||
            !validator.fields.includes(name)) &&
          (!(typeof validator.fields === "function") || !validator.fields(name))
        ) {
          return errors
        }
        return errors
          .filter(
            e => e.source !== "synchronous" || e.validator !== validator.id,
          )
          .concat(
            validator.validator(newValues).map(common => ({
              source: "synchronous",
              validator: validator.id,
              time,
              common,
            })),
          )
      }, state.errors)

      return {
        currentValues: newValues,
        valuesUpdateTime: {...state.valuesUpdateTime, [name]: time},
        errors: newErrors,
      }
    }

    return this._form.setState(updater)
  }

  _initializeState(
    props: $PropertyType<Form<Value, SubmitMeta, ErrorMeta>, "props">,
  ) {
    const initialValues = props.initialValues || {}
    const validators = props.validators || []

    const time = getTime()

    this._form.state = {
      initialValues,
      currentValues: initialValues,
      valuesUpdateTime: {},
      pendingSubmit: null,
      lastResolvedSubmit: null,
      errors: validators
        .map(
          v =>
            v.tag === "synchronous"
              ? v.validator(initialValues).map(common => ({
                  source: "synchronous",
                  validator: v.id,
                  time,
                  common,
                }))
              : [],
        )
        .reduce((a, b) => a.concat(b), []),
    }
  }
}
