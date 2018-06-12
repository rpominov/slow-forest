// @flow

import FormApi from "./FormApi"
import {CancellationTokenShim} from "./cancellation"

export type Values<V> = $ReadOnly<{[k: string]: V}>

export type UnknownField = $ReadOnly<{unknownField: true}>
export type FieldList = $ReadOnlyArray<string> | UnknownField
export type FieldIdentifier = string | UnknownField

export type ValueSnapshot<V> = $ReadOnly<{|
  time: number,
  fieldName: string,
  value: V,
  isPersistent: boolean,
|}>

export type FormError<EM> = $ReadOnly<{|
  fieldNames: FieldList,
  message: string,
  meta: EM,
|}>

export type ErrorSource =
  | $ReadOnly<{|type: "synchronous"|}>
  | $ReadOnly<{|type: "submit"|}>
  | $ReadOnly<{|
      type: "asynchronous",
      validationKind: string,
      appliedToFields: FieldList,
    |}>

export type FormErrorProcessed<EM> = $ReadOnly<{|
  ...FormError<EM>,
  time: number,
  source: ErrorSource,
  isOutdated: boolean,
|}>

export type SyncValidator<V, EM> = (Values<V>) => $ReadOnlyArray<FormError<EM>>

// m?
export type AsyncValidationStatus<EM> = $ReadOnly<{|
  validationKind: string,
  applyToFields: FieldList,
  pending: $ReadOnly<{|
    requestTime: number,
    startTime: number | null,
    cancellationToken: CancellationTokenShim,
  |}> | null,
  finished: $ReadOnly<{|
    requestTime: number,
    startTime: number,
    endTime: number,
    errors: Array<FormError<EM>>,
  |}> | null,
|}>

export type AsyncValidationRequestPending = $ReadOnly<{|
  status: "pending",
  requestTime: number,
  cancellationToken: CancellationTokenShim,
  validationKind: string,
  applyToFields: FieldList,
|}>

export type AsyncValidationRequestRunning = $ReadOnly<{|
  status: "running",
  requestTime: number,
  startTime: number,
  cancellationToken: CancellationTokenShim,
  validationKind: string,
  applyToFields: FieldList,
|}>

export type AsyncValidationRequestResolved<EM> = $ReadOnly<{|
  status: "resolved",
  requestTime: number,
  startTime: number,
  endTime: number,
  errors: Array<FormError<EM>>,
  validationKind: string,
  applyToFields: FieldList,
|}>

export type AsyncValidationRequest<EM> =
  | AsyncValidationRequestPending
  | AsyncValidationRequestRunning
  | AsyncValidationRequestResolved<EM>

export type AsyncValidator<V, SM, EM> = (
  FormApi<V, SM, EM>,
  $ReadOnlyArray<AsyncValidationRequestPending>,
) => $ReadOnlyArray<Promise<$ReadOnlyArray<FormError<EM>> | void>>

export type SubmitResult<SM, EM> = $ReadOnly<{|
  errors: $ReadOnlyArray<FormError<EM>>,
  meta: SM,
|}>

export type SubmitHandler<V, SM, EM> = (
  FormApi<V, SM, EM>,
  CancellationTokenShim,
) => Promise<SubmitResult<SM, EM> | void>

export type RunningSubmit = $ReadOnly<{|
  startTime: number,
  cancellationToken: CancellationTokenShim,
|}>

export type ResolvedSubmit<SM, EM> = $ReadOnly<{|
  startTime: number,
  endTime: number,
  result: SubmitResult<SM, EM>,
|}>
