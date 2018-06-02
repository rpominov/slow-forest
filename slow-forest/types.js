// @flow

import FormApi from "./FormApi"
import {CancellationTokenShim, CancellationSourceShim} from "./cancellation"

export type Time = $ReadOnly<{|time: number, count: number|}>

export type Values<Value> = $ReadOnly<{[k: string]: Value}>

export type ValueSnapshot<Value> = $ReadOnly<{|
  time: Time,
  fieldName: string,
  value: Value | void,
  isPersistent: boolean,
  isInitial: boolean,
|}>

export type FormError<ErrorMeta> = $ReadOnly<{|
  fieldNames: $ReadOnlyArray<string> | "all",
  message: string,
  meta: ErrorMeta,
|}>

export type ErrorSource<Value> =
  | $ReadOnly<{|type: "synchronous"|}>
  | $ReadOnly<{|type: "submit"|}>
  | $ReadOnly<{|
      type: "asynchronous",
      validationKind: string,
      appliedToFields: $ReadOnlyArray<string> | "all",
    |}>

export type FormErrorProcessed<Value, ErrorMeta> = $ReadOnly<{|
  ...FormError<ErrorMeta>,
  source: ErrorSource<Value>,
|}>

export type SyncValidator<Value, ErrorMeta> = (
  Values<Value>,
) => $ReadOnlyArray<FormError<ErrorMeta>>

export type AsyncValidationRequestPending = $ReadOnly<{|
  status: "pending",
  requestTime: Time,
  cancellationToken: CancellationTokenShim,
  _cancellationSource: CancellationSourceShim,
  validationKind: string,
  fieldNames: $ReadOnlyArray<string> | "all",
|}>

export type AsyncValidationRequestRunning = $ReadOnly<{|
  status: "running",
  requestTime: Time,
  startTime: Time,
  cancellationToken: CancellationTokenShim,
  _cancellationSource: CancellationSourceShim,
  validationKind: string,
  fieldNames: $ReadOnlyArray<string> | "all",
|}>

export type AsyncValidationRequestResolved<ErrorMeta> = $ReadOnly<{|
  status: "resolved",
  requestTime: Time,
  startTime: Time,
  endTime: Time,
  errors: Array<FormError<ErrorMeta>>,
  validationKind: string,
  fieldNames: $ReadOnlyArray<string> | "all",
|}>

export type AsyncValidationRequest<ErrorMeta> =
  | AsyncValidationRequestPending
  | AsyncValidationRequestRunning
  | AsyncValidationRequestResolved<ErrorMeta>

export type AsyncValidator<Value, SubmitMeta, ErrorMeta> = (
  FormApi<Value, SubmitMeta, ErrorMeta>,
  $ReadOnlyArray<AsyncValidationRequestPending>,
) => $ReadOnlyArray<Promise<$ReadOnlyArray<FormError<ErrorMeta>>>>

export type SubmitResult<SubmitMeta, ErrorMeta> = $ReadOnly<{|
  errors: $ReadOnlyArray<FormError<ErrorMeta>>,
  meta: SubmitMeta,
|}>

export type SubmitHandler<Value, SubmitMeta, ErrorMeta> = (
  FormApi<Value, SubmitMeta, ErrorMeta>,
  CancellationTokenShim,
) => Promise<SubmitResult<SubmitMeta, ErrorMeta> | void>

export type PendingSubmit = $ReadOnly<{|
  startTime: Time,
  cancellationToken: CancellationTokenShim,
  _cancellationSource: CancellationSourceShim,
|}>

export type ResolvedSubmit<SubmitMeta, ErrorMeta> = $ReadOnly<{|
  startTime: Time,
  endTime: Time,
  result: SubmitResult<SubmitMeta, ErrorMeta>,
|}>
