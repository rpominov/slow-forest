// @flow

import FormApi from "./FormApi"
import {CancellationTokenShim} from "./cancellation"

export type Time = $ReadOnly<{|time: number, count: number|}>

export type Values<V> = $ReadOnly<{[k: string]: V}>

export type ValueSnapshot<V> = $ReadOnly<{|
  time: Time,
  fieldName: string,
  value: V,
  isPersistent: boolean,
|}>

export type FormError<EM> = $ReadOnly<{|
  fieldNames: $ReadOnlyArray<string> | "unknown",
  message: string,
  meta: EM,
|}>

export type ErrorSource<V> =
  | $ReadOnly<{|type: "synchronous"|}>
  | $ReadOnly<{|type: "submit"|}>
  | $ReadOnly<{|
      type: "asynchronous",
      validationKind: string,
      appliedToFields: $ReadOnlyArray<string> | "unknown",
    |}>

export type FormErrorProcessed<V, EM> = $ReadOnly<{|
  ...FormError<EM>,
  source: ErrorSource<V>,
|}>

export type SyncValidator<V, EM> = (Values<V>) => $ReadOnlyArray<FormError<EM>>

export type AsyncValidationRequestPending = $ReadOnly<{|
  status: "pending",
  requestTime: Time,
  cancellationToken: CancellationTokenShim,
  validationKind: string,
  fieldNames: $ReadOnlyArray<string> | "unknown",
|}>

export type AsyncValidationRequestRunning = $ReadOnly<{|
  status: "running",
  requestTime: Time,
  startTime: Time,
  cancellationToken: CancellationTokenShim,
  validationKind: string,
  fieldNames: $ReadOnlyArray<string> | "unknown",
|}>

export type AsyncValidationRequestResolved<EM> = $ReadOnly<{|
  status: "resolved",
  requestTime: Time,
  startTime: Time,
  endTime: Time,
  errors: Array<FormError<EM>>,
  validationKind: string,
  fieldNames: $ReadOnlyArray<string> | "unknown",
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
  startTime: Time,
  cancellationToken: CancellationTokenShim,
|}>

export type ResolvedSubmit<SM, EM> = $ReadOnly<{|
  startTime: Time,
  endTime: Time,
  result: SubmitResult<SM, EM>,
|}>
