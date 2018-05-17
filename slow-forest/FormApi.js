// @flow

import getTime from "./getTime"
import Form from "./Form"
import type {CancelSubmit, SubmitResolution, SubmitState} from "./types"

export default class FormAPI {
  _form: Form
  _cancelSubmit: CancelSubmit
  submitEventHandler: (e: Event) => void

  constructor(form: Form) {
    this._form = form
    this.submitEventHandler = e => {
      e.preventDefault()
      this.submit()
    }
  }

  initializeState(props: $PropertyType<Form, "props">) {
    const {syncValidator, initialValues} = props
    const syncErrors = syncValidator ? syncValidator(initialValues) : []

    this._form.state = {
      initialValues,
      currentValues: initialValues,
      valuesUpdateTime: {},
      submits: [],
      syncErrors,
    }
  }

  _resolveSubmit(
    resolution: SubmitResolution<mixed, mixed>,
    afterSubmit: () => void,
  ): void {
    this._form.setState(state => {
      const {submits} = state

      if (submits.length === 0) {
        throw new Error("call to _resolveSubmit() but there were no submits")
      }

      // ignore cases when a submit finishes
      // after it was already resolved (canceled or finished)
      // TODO: ignore afterSubmit if we ignore resolution?
      if (submits[0].resolution !== null) {
        return {}
      }

      return {
        submits: [{...submits[0], resolution}, ...submits.slice(1)],
      }
    }, afterSubmit)
  }

  _addNewSubmit(submit: SubmitState<mixed, mixed>): void {
    this._form.setState(state => {
      const {submits} = state
      return {
        submits: [submit, ...submits],
      }
    })
  }

  submit() {
    const {submitHandler} = this._form.props
    const {currentValues, submits} = this._form.state

    if (submits.length !== 0 && submits[0].resolution === null) {
      if (this._cancelSubmit) {
        this._cancelSubmit()
      }
      this._cancelSubmit = null
      this._resolveSubmit({t: "canceled", time: getTime()}, () => undefined)
    }

    this._addNewSubmit({
      startTime: getTime(),
      values: currentValues,
      resolution: null,
    })

    this._cancelSubmit = submitHandler(currentValues, (result, afterSubmit) => {
      this._cancelSubmit = null
      this._resolveSubmit({t: "finished", time: getTime(), result}, afterSubmit)
    })
  }

  getValue(name: string) {
    return this._form.state.currentValues[name]
  }

  setValue(name: string, newValue: mixed) {
    const {syncValidator} = this._form.props
    function updater(state) {
      const newValues = {...state.currentValues, [name]: newValue}
      const newSyncErrors = syncValidator ? syncValidator(newValues) : []
      return {
        currentValues: newValues,
        syncErrors: newSyncErrors,
        valuesUpdateTime: {...state.valuesUpdateTime, [name]: getTime()},
      }
    }

    return this._form.setState(updater)
  }
}
