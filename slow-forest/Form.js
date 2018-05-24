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
  Canceler,
} from "./types"

type Props<Value, SubmitMeta, ErrorMeta> = {|
  render: (FormAPI<Value, SubmitMeta, ErrorMeta>) => React.Node,
  initialValues?: Values<Value>,
  submitHandler?: SubmitHandler<Value, SubmitMeta, ErrorMeta>,
  validators?: $ReadOnlyArray<Validator<Value, ErrorMeta>>,
|}

type State<Value, SubmitMeta, ErrorMeta> = {|
  initialValues: Values<Value>,
  initializationTime: Time,
  currentValues: Values<Value>,
  valuesUpdateTime: $ReadOnly<{[k: string]: Time}>,
  pendingSubmit: PendingSubmit<Value> | null,
  resolvedSubmit: ResolvedSubmit<Value, SubmitMeta, ErrorMeta> | null,
  errors: $ReadOnlyArray<FormErrorProcessed<Value, ErrorMeta>>,
|}

export default class Form<Value, SubmitMeta, ErrorMeta> extends React.Component<
  Props<Value, SubmitMeta, ErrorMeta>,
  State<Value, SubmitMeta, ErrorMeta>,
> {
  api: FormAPI<Value, SubmitMeta, ErrorMeta>
  state: State<Value, SubmitMeta, ErrorMeta>
  _cancelSubmit: Canceler

  constructor(props: Props<Value, SubmitMeta, ErrorMeta>) {
    super(props)
    const initialValues = props.initialValues || {}
    const validators = props.validators || []

    const time = getTime()

    this.state = {
      initialValues,
      initializationTime: time,
      currentValues: initialValues,
      valuesUpdateTime: {},
      pendingSubmit: null,
      resolvedSubmit: null,
      errors: validators
        .map(
          v =>
            v.tag === "synchronous"
              ? v.validator(initialValues).map(common => ({
                  source: "synchronous",
                  validator: v.id,
                  time,
                  fieldValue:
                    common.fieldName === null
                      ? undefined
                      : initialValues[common.fieldName],
                  ...common,
                }))
              : [],
        )
        .reduce((a, b) => a.concat(b), []),
    }

    this.api = new FormAPI(this)
  }

  submit(): void {
    const {submitHandler} = this.props
    const {currentValues, pendingSubmit} = this.state

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

    this.setState({pendingSubmit: {startTime, values: currentValues}})

    this._cancelSubmit = submitHandler(this.api, (result, afterSubmit) => {
      this._cancelSubmit = null

      const {pendingSubmit, resolvedSubmit, errors} = this.state

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
                fieldValue:
                  common.fieldName === null
                    ? undefined
                    : pendingSubmit.values[common.fieldName],
                ...common,
              })),
            )

      const newState = {
        pendingSubmit: null,
        resolvedSubmit: {
          ...pendingSubmit,
          endTime: getTime(),
          result,
        },
        errors: newErrors,
      }

      this.setState(newState, afterSubmit)
    })
  }

  getValues(): Values<Value> {
    return this.state.currentValues
  }

  setValue(name: string, newValue: Value): void {
    const validators = this.props.validators || []

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
              fieldValue:
                common.fieldName === null
                  ? undefined
                  : newValues[common.fieldName],
              ...common,
            })),
          )
      }, state.errors)

      return {
        currentValues: newValues,
        valuesUpdateTime: {...state.valuesUpdateTime, [name]: time},
        errors: newErrors,
      }
    }

    return this.setState(updater)
  }

  getErrors(options: {
    field?: string | null,
    includeOutdated?: boolean,
  }): $ReadOnlyArray<FormErrorProcessed<Value, ErrorMeta>> {
    const {errors, valuesUpdateTime} = this.state
    const mostRecentValueUpdate = Object.keys(valuesUpdateTime).reduce(
      (res, key) => Math.max(res, valuesUpdateTime[key].count),
      0,
    )

    const isCorrectField =
      options.field === undefined
        ? e => true
        : e => e.fieldName === options.field

    const isCorrectTime =
      options.includeOutdated === true
        ? e => true
        : e =>
            e.fieldName === null
              ? e.time.count >= mostRecentValueUpdate
              : valuesUpdateTime[e.fieldName] === undefined ||
                e.time.count >= valuesUpdateTime[e.fieldName].count

    return this.state.errors.filter(e => isCorrectField(e) && isCorrectTime(e))
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
