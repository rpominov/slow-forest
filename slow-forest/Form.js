// @flow

import * as React from "react"
import getTime from "./getTime"
import FormAPI from "./FormApi"
import type {
  Time,
  Values,
  SubmitHandler,
  RunningSubmit,
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
  AsyncValidationRequest,
} from "./types"

import {CancellationTokenShim} from "./cancellation"

type Props<V, SM, EM> = {|
  render: (FormAPI<V, SM, EM>) => React.Node,
  initialValues?: Values<V>,
  submitHandler?: SubmitHandler<V, SM, EM>,
  afterSubmit?: (FormAPI<V, SM, EM>) => void,
  syncValidator?: SyncValidator<V, EM>,
  asyncValidator?: AsyncValidator<V, SM, EM>,
|}

type State<V, SM, EM> = {|
  initializationTime: Time,
  values: $ReadOnlyArray<ValueSnapshot<V>>,
  touchedFields: $ReadOnlyArray<string>,
  runningSubmit: RunningSubmit | null,
  resolvedSubmit: ResolvedSubmit<SM, EM> | null,
  pendingValidationRequests: $ReadOnlyArray<AsyncValidationRequestPending>,
  runningValidationRequests: $ReadOnlyArray<AsyncValidationRequestRunning>,
  resolvedValidationRequests: $ReadOnlyArray<
    AsyncValidationRequestResolved<EM>,
  >,
|}

type StateUpdater<S> = (state: S) => $Shape<S>

export default class Form<V, SM, EM> extends React.Component<
  Props<V, SM, EM>,
  State<V, SM, EM>,
> {
  api: FormAPI<V, SM, EM>
  state: State<V, SM, EM>

  constructor(props: Props<V, SM, EM>) {
    super(props)

    const initializationTime = getTime()

    const initialValues = props.initialValues || {}
    const values = Object.keys(initialValues).map(fieldName => ({
      fieldName,
      value: initialValues[fieldName],
      time: initializationTime,
      isPersistent: true,
    }))

    this.state = {
      initializationTime,
      values,
      touchedFields: [],
      runningSubmit: null,
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
    state: State<V, SM, EM> = this.state,
  ): ValueSnapshot<V> | null {
    return (
      state.values.find(
        snapshot =>
          snapshot.fieldName === fieldName &&
          (time === undefined || snapshot.time.count <= time.count),
      ) || null
    )
  }

  _forEachSnapshotInReverse(
    fn: (ValueSnapshot<V>) => void,
    state: State<V, SM, EM> = this.state,
  ) {
    for (let i = state.values.length - 1; i >= 0; i--) {
      fn(state.values[i])
    }
  }

  _persistCurrentValues(
    state: State<V, SM, EM> = this.state,
  ): $Shape<State<V, SM, EM>> {
    return {
      values: state.values.map(snapshot => ({...snapshot, isPersistent: true})),
    }
  }

  _getValue(fieldName: string, time?: Time): V | void {
    const snapshot = this._getLatestSnapshot(fieldName, time)
    return snapshot ? snapshot.value : undefined
  }

  _setValue(fieldName: string, value: V): void {
    this.setState(state => ({
      values: [
        {
          fieldName,
          isPersistent: false,
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
    const runningSubmit = {
      startTime,
      cancellationToken: new CancellationTokenShim(),
    }
    this.setState(state => ({
      ...this._persistCurrentValues(state),
      runningSubmit,
    }))
    return submitHandler(this.api, runningSubmit.cancellationToken).then(
      result => {
        const {runningSubmit, resolvedSubmit} = this.state

        if (
          runningSubmit === null ||
          runningSubmit.startTime.count !== startTime.count
        ) {
          return
        }

        runningSubmit.cancellationToken._close()

        // Promised resolved to undefined although submit wasn't canceled
        if (result === undefined) {
          this.setState({runningSubmit: null})
          throw new TypeError("TODO: error message")
        }

        this.setState(
          {
            runningSubmit: null,
            resolvedSubmit: {
              startTime: runningSubmit.startTime,
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
    const {runningSubmit} = this.state
    if (runningSubmit === null) {
      return
    }
    this.setState({runningSubmit: null})
    runningSubmit.cancellationToken._cancel()
  }

  _getValues(time?: Time): Values<V> {
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

  _requestAsyncValidation(
    validationKind: string,
    fieldNames: $ReadOnlyArray<string> | "unknown",
  ): void {
    this.setState(state => {
      return {
        pendingValidationRequests: [
          {
            status: "pending",
            requestTime: getTime(),
            validationKind,
            fieldNames,
            cancellationToken: new CancellationTokenShim(),
          },
          // TODO:
          //   we should cancel the token when removing
          //   also we should remove and cancell a running request if exists
          ...state.pendingValidationRequests.filter(
            request => !sameKindAndFields(request, validationKind, fieldNames),
          ),
        ],
      }
    })
  }

  _performAsyncValidations(fieldName: string): Promise<void> {
    const {asyncValidator} = this.props

    if (!asyncValidator) {
      throw new Error("TODO: error message")
    }

    function isRelevantRequest(request) {
      return (
        request.fieldNames !== "unknown" &&
        request.fieldNames.includes(fieldName)
      )
    }

    const startTime = getTime()

    const relevantRequests = this.state.pendingValidationRequests.filter(
      isRelevantRequest,
    )

    const newRunningRequests = relevantRequests.map(r => ({
      status: "running",
      startTime,
      requestTime: r.requestTime,
      cancellationToken: r.cancellationToken,
      validationKind: r.validationKind,
      fieldNames: r.fieldNames,
    }))

    const newPendingRequests = this.state.pendingValidationRequests.filter(
      r => !isRelevantRequest(r),
    )

    this.setState({
      pendingValidationRequests: newPendingRequests,
      runningValidationRequests: [
        ...this.state.runningValidationRequests,
        ...newRunningRequests,
      ],
    })

    return Promise.all(
      asyncValidator(this.api, relevantRequests).map((promise, i) => {
        const request = newRunningRequests[i]
        return promise.then(errors => {
          if (!this.state.runningValidationRequests.includes(request)) {
            return
          }

          request.cancellationToken._close()

          const newRunningRequests = this.state.runningValidationRequests.filter(
            r => r !== request,
          )

          // Promised resolved to undefined although validation wasn't canceled
          if (errors === undefined) {
            this.setState({runningValidationRequests: newRunningRequests})
            throw new Error("TODO: error message")
          }

          const resolvedRequest = {
            status: "resolved",
            requestTime: request.requestTime,
            startTime: request.startTime,
            endTime: getTime(),
            errors: errors.map(e => e),
            validationKind: request.validationKind,
            fieldNames: request.fieldNames,
          }

          const newResolvedRequests = [
            resolvedRequest,
            ...this.state.resolvedValidationRequests.filter(
              r =>
                !sameKindAndFields(
                  r,
                  request.validationKind,
                  request.fieldNames,
                ),
            ),
          ]

          this.setState({
            runningValidationRequests: newRunningRequests,
            resolvedValidationRequests: newResolvedRequests,
          })
        })
      }),
    ).then(() => undefined)
  }

  _valuesChangedSince(values: $ReadOnlyArray<string> | "unknown", time: Time) {
    return this.state.values.some(
      snapshot =>
        snapshot.time.count > time.count &&
        (values === "unknown" || values.includes(snapshot.fieldName)),
    )
  }

  _getAllErrors(
    includeOutdated: boolean,
  ): $ReadOnlyArray<FormErrorProcessed<V, EM>> {
    const {syncValidator} = this.props
    const {
      resolvedSubmit,
      resolvedValidationRequests,
      pendingValidationRequests,
      runningValidationRequests,
    } = this.state

    const synchronous = (syncValidator
      ? syncValidator(this._getValues())
      : []
    ).map(error => ({...error, source: {type: "synchronous"}}))

    const submit = (resolvedSubmit
      ? resolvedSubmit.result.errors.filter(
          error =>
            includeOutdated ||
            !this._valuesChangedSince(
              error.fieldNames,
              resolvedSubmit.startTime,
            ),
        )
      : []
    ).map(error => ({...error, source: {type: "submit"}}))

    const asynchronous = (includeOutdated
      ? resolvedValidationRequests
      : resolvedValidationRequests.filter(
          request =>
            !pendingValidationRequests.some(r =>
              sameKindAndFields(r, request.validationKind, request.fieldNames),
            ) &&
            !runningValidationRequests.some(r =>
              sameKindAndFields(r, request.validationKind, request.fieldNames),
            ),
        )
    )
      .map(request =>
        request.errors.map(error => ({
          ...error,
          source: {
            type: "asynchronous",
            validationKind: request.validationKind,
            appliedToFields: request.fieldNames,
          },
        })),
      )
      .reduce((a, b) => [...a, ...b], [])

    return [...synchronous, ...submit, ...asynchronous]
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

// function getValidationRequestId<EM>(
//   validationRequest: AsyncValidationRequest<EM>,
// ): string {
//   return [
//     validationRequest.validationKind,
//     ...(validationRequest.fieldNames === "unknown"
//       ? []
//       : validationRequest.fieldNames),
//   ]
//     .map(s => s.replace(/_/g, "__").replace(/\./g, "_."))
//     .join(".")
// }

function isEqualArray<T>(a: $ReadOnlyArray<T>, b: $ReadOnlyArray<T>): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i])
}

function sameKindAndFields<EM>(
  validationRequest: AsyncValidationRequest<EM>,
  validationKind: string,
  fieldNames: $ReadOnlyArray<string> | "unknown",
): boolean {
  if (validationRequest.validationKind !== validationKind) {
    return false
  }

  if (fieldNames === "unknown") {
    return validationRequest.fieldNames === "unknown"
  }

  return (
    validationRequest.fieldNames !== "unknown" &&
    isEqualArray(validationRequest.fieldNames, fieldNames)
  )
}
