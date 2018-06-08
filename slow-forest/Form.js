// @flow

import * as React from "react"
import FormAPI from "./FormApi"
import type {
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
  FieldList,
  FieldIdentifier,
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
  initializationTime: number,
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
  _timeCounter: number

  constructor(props: Props<V, SM, EM>) {
    super(props)

    this._timeCounter = 0

    const initializationTime = this._getTime()

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

  _getTime(): number {
    this._timeCounter++
    return this._timeCounter
  }

  _getLatestSnapshot(
    fieldName: string,
    time?: number,
    state: State<V, SM, EM> = this.state,
  ): ValueSnapshot<V> | null {
    return (
      state.values.find(
        snapshot =>
          snapshot.fieldName === fieldName &&
          (time === undefined || snapshot.time <= time),
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

  _getValue(fieldName: string, time?: number): V | void {
    const snapshot = this._getLatestSnapshot(fieldName, time)
    return snapshot ? snapshot.value : undefined
  }

  _setValue(fieldName: string, value: V): void {
    this.setState(state => ({
      values: [
        {
          fieldName,
          isPersistent: false,
          time: this._getTime(),
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

    const startTime = this._getTime()
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

        if (runningSubmit === null || runningSubmit.startTime !== startTime) {
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
              endTime: this._getTime(),
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

  _getValues(time?: number): Values<V> {
    const result = {}
    this._forEachSnapshotInReverse(snapshot => {
      if (time === undefined || snapshot.time <= time) {
        result[snapshot.fieldName] = snapshot.value
      }
    })
    return result
  }

  _getValueUpdateTime(fieldName: string): number {
    const snapshot = this._getLatestSnapshot(fieldName)
    return snapshot === null ? this.state.initializationTime : snapshot.time
  }

  _requestAsyncValidation(
    validationKind: string,
    applyToFields: FieldList,
  ): void {
    this.setState(state => {
      return {
        pendingValidationRequests: [
          {
            status: "pending",
            requestTime: this._getTime(),
            validationKind,
            applyToFields,
            cancellationToken: new CancellationTokenShim(),
          },
          // TODO:
          //   we should cancel the token when removing
          //   also we should remove and cancell a running request if exists
          ...state.pendingValidationRequests.filter(
            request =>
              !sameKindAndFields(request, validationKind, applyToFields),
          ),
        ],
      }
    })
  }

  // TODO: _persistCurrentValues
  _performAsyncValidations(fieldName: FieldIdentifier): Promise<void> {
    const {asyncValidator} = this.props

    if (!asyncValidator) {
      throw new Error("TODO: error message")
    }

    const startTime = this._getTime()

    const relevantRequests = this.state.pendingValidationRequests.filter(
      request => fieldListsIncludes(request.applyToFields, fieldName),
    )

    const newRunningRequests = relevantRequests.map(r => ({
      status: "running",
      startTime,
      requestTime: r.requestTime,
      cancellationToken: r.cancellationToken,
      validationKind: r.validationKind,
      applyToFields: r.applyToFields,
    }))

    const newPendingRequests = this.state.pendingValidationRequests.filter(
      request => !fieldListsIncludes(request.applyToFields, fieldName),
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
            endTime: this._getTime(),
            errors: errors.map(e => e),
            validationKind: request.validationKind,
            applyToFields: request.applyToFields,
          }

          const newResolvedRequests = [
            resolvedRequest,
            ...this.state.resolvedValidationRequests.filter(
              r =>
                !sameKindAndFields(
                  r,
                  request.validationKind,
                  request.applyToFields,
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

  _haveValuesChangedSince(values: FieldList, time: number): boolean {
    // FIXME:
    //   we assume here that if `values` is UnknownField
    //   than any change counts, but should we?
    return this.state.values.some(
      snapshot =>
        snapshot.time > time &&
        (!Array.isArray(values) || values.includes(snapshot.fieldName)),
    )
  }

  _getAllErrors(
    includeOutdated: boolean,
  ): $ReadOnlyArray<FormErrorProcessed<EM>> {
    const {syncValidator} = this.props
    const {
      resolvedSubmit,
      resolvedValidationRequests,
      pendingValidationRequests,
      runningValidationRequests,
    } = this.state

    const time = this._getTime()

    const synchronous = syncValidator
      ? syncValidator(this._getValues()).map(error => ({
          ...error,
          source: {type: "synchronous"},
          time,
        }))
      : []

    const submit = resolvedSubmit
      ? resolvedSubmit.result.errors
          .filter(
            error =>
              includeOutdated ||
              !this._haveValuesChangedSince(
                error.fieldNames,
                resolvedSubmit.startTime,
              ),
          )
          .map(error => ({
            ...error,
            source: {type: "submit"},
            time: resolvedSubmit.startTime,
          }))
      : []

    const asynchronous = (includeOutdated
      ? resolvedValidationRequests
      : resolvedValidationRequests.filter(
          request =>
            !pendingValidationRequests.some(r =>
              sameKindAndFields(
                r,
                request.validationKind,
                request.applyToFields,
              ),
            ) &&
            !runningValidationRequests.some(r =>
              sameKindAndFields(
                r,
                request.validationKind,
                request.applyToFields,
              ),
            ),
        )
    )
      .map(request =>
        request.errors.map(error => ({
          ...error,
          source: {
            type: "asynchronous",
            validationKind: request.validationKind,
            appliedToFields: request.applyToFields,
          },
          time: request.startTime,
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
  applyToFields: FieldList,
): boolean {
  return (
    validationRequest.validationKind === validationKind &&
    sameFieldLists(applyToFields, validationRequest.applyToFields)
  )
}

export function sameFieldLists(a: FieldList, b: FieldList): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return isEqualArray(a, b)
  }
  return !Array.isArray(a) && !Array.isArray(b)
}

export function fieldListsIncludes(
  list: FieldList,
  value: FieldIdentifier,
): boolean {
  if (Array.isArray(list) && typeof value === "string") {
    return list.includes(value)
  }
  return !Array.isArray(list) && typeof value !== "string"
}
