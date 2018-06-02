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
  SyncValidator,
  AsyncValidator,
  FormErrorProcessed,
  FormError,
  ErrorSource,
  ValueSnapshot,
  AsyncValidationRequestPending,
  AsyncValidationRequestRunning,
  AsyncValidationRequestResolved,
} from "./types"

import {CancellationSourceShim} from "./cancellation"

type Props<Value, SubmitMeta, ErrorMeta> = {|
  render: (FormAPI<Value, SubmitMeta, ErrorMeta>) => React.Node,
  initialValues?: Values<Value>,
  submitHandler?: SubmitHandler<Value, SubmitMeta, ErrorMeta>,
  afterSubmit?: (FormAPI<Value, SubmitMeta, ErrorMeta>) => void,
  syncValidator?: SyncValidator<Value, ErrorMeta>,
  asyncValidator?: AsyncValidator<Value, SubmitMeta, ErrorMeta>,
|}

type State<Value, SubmitMeta, ErrorMeta> = {|
  initializationTime: Time,
  values: $ReadOnlyArray<ValueSnapshot<Value>>,
  touchedFields: $ReadOnlyArray<string>,
  pendingSubmit: PendingSubmit | null,
  resolvedSubmit: ResolvedSubmit<SubmitMeta, ErrorMeta> | null,
  pendingValidationRequests: $ReadOnlyArray<AsyncValidationRequestPending>,
  runningValidationRequests: $ReadOnlyArray<AsyncValidationRequestRunning>,
  resolvedValidationRequests: $ReadOnlyArray<
    AsyncValidationRequestResolved<ErrorMeta>,
  >,
|}

type StateUpdater<S> = (state: S) => $Shape<S>

export default class Form<Value, SubmitMeta, ErrorMeta> extends React.Component<
  Props<Value, SubmitMeta, ErrorMeta>,
  State<Value, SubmitMeta, ErrorMeta>,
> {
  api: FormAPI<Value, SubmitMeta, ErrorMeta>
  state: State<Value, SubmitMeta, ErrorMeta>

  constructor(props: Props<Value, SubmitMeta, ErrorMeta>) {
    super(props)

    const initializationTime = getTime()

    const initialValues = props.initialValues || {}
    const values = Object.keys(initialValues).map(fieldName => ({
      fieldName,
      value: initialValues[fieldName],
      time: initializationTime,
      isPersistent: true,
      isInitial: true,
    }))

    this.state = {
      initializationTime,
      values,
      touchedFields: [],
      pendingSubmit: null,
      resolvedSubmit: null,
      pendingValidationRequests: [],
      runningValidationRequests: [],
      resolvedValidationRequests: [],
    }

    this.api = new FormAPI(this)
  }

  _getLatestSnapshot(
    fieldName: string,
    time?: Time,
    state: State<Value, SubmitMeta, ErrorMeta> = this.state,
  ): ValueSnapshot<Value> | null {
    return (
      state.values.find(
        snapshot =>
          snapshot.fieldName === fieldName &&
          (time === undefined || snapshot.time.count <= time.count),
      ) || null
    )
  }

  _forEachSnapshotInReverse(
    fn: (ValueSnapshot<Value>) => void,
    state: State<Value, SubmitMeta, ErrorMeta> = this.state,
  ) {
    for (let i = state.values.length - 1; i >= 0; i--) {
      fn(state.values[i])
    }
  }

  _persistCurrentValues(
    state: State<Value, SubmitMeta, ErrorMeta> = this.state,
  ): $Shape<State<Value, SubmitMeta, ErrorMeta>> {
    return {
      values: state.values.map(snapshot => ({...snapshot, isPersistent: true})),
    }
  }

  _getValue(fieldName: string, time?: Time): Value | void {
    const snapshot = this._getLatestSnapshot(fieldName, time)
    return snapshot ? snapshot.value : undefined
  }

  _setValue(fieldName: string, value: Value): void {
    this.setState(state => ({
      values: [
        {
          fieldName,
          isPersistent: false,
          isInitial: false,
          time: getTime(),
          value,
        },
        ...state.values.filter(
          snapshot => snapshot.fieldName !== fieldName || snapshot.isPersistent,
        ),
      ],
    }))
  }

  _setTouched(fieldName: string, isTouched: boolean): void {
    this.setState(
      state =>
        state.touchedFields.includes(fieldName)
          ? {}
          : {touchedFields: [...state.touchedFields, fieldName]},
    )
  }

  _afterSubmit = (): void => {
    const {afterSubmit} = this.props
    if (afterSubmit) {
      afterSubmit(this.api)
    }
  }

  _submit(): Promise<void> {
    const {submitHandler} = this.props

    this._cancelSubmit()

    if (!submitHandler) {
      return Promise.resolve()
    }

    const startTime = getTime()
    const _cancellationSource = new CancellationSourceShim()
    const pendingSubmit = {
      startTime,
      _cancellationSource,
      cancellationToken: _cancellationSource.token,
    }
    this.setState(state => ({
      ...this._persistCurrentValues(state),
      pendingSubmit,
    }))
    return submitHandler(this.api, pendingSubmit.cancellationToken).then(
      result => {
        const {pendingSubmit, resolvedSubmit} = this.state

        if (
          pendingSubmit === null ||
          pendingSubmit.startTime.count !== startTime.count
        ) {
          return
        }

        pendingSubmit._cancellationSource.close()

        // Promised resolved to undefined although submit wasn't canceled
        if (result === undefined) {
          this.setState({pendingSubmit: null})
          throw new TypeError("TODO: error message")
        }

        this.setState(
          {
            pendingSubmit: null,
            resolvedSubmit: {
              startTime: pendingSubmit.startTime,
              endTime: getTime(),
              result,
            },
          },
          this._afterSubmit,
        )
      },
    )
  }

  _cancelSubmit(): void {
    const {pendingSubmit} = this.state
    if (pendingSubmit === null) {
      return
    }
    this.setState({pendingSubmit: null})
    pendingSubmit._cancellationSource.cancel()
  }

  _getValues(time?: Time): Values<Value> {
    const result = {}
    this._forEachSnapshotInReverse(snapshot => {
      if (time === undefined || snapshot.time.count <= time.count) {
        result[snapshot.fieldName] = snapshot.value
      }
    })
    return result
  }

  _getValueUpdateTime(fieldName: string): Time {
    const snapshot = this._getLatestSnapshot(fieldName)
    return snapshot === null ? this.state.initializationTime : snapshot.time
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
