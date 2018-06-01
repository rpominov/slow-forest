// @flow

import FormApi from "./FormApi"
import {CancellationTokenShim} from "./cancellation"

export type Time = $ReadOnly<{|time: number, count: number|}>

export type Values<Value> = $ReadOnly<{[k: string]: Value}>

export type FormError<ErrorMeta> = $ReadOnly<{|
  fieldName: $ReadOnlyArray<string>, // use something like __form__ for whole form errors
  message: string,
  meta: ErrorMeta,
|}>

export type ErrorSource =
  | $ReadOnly<{|type: "submit"|}>
  | $ReadOnly<{|type: "validator", id: string|}>

export type FormErrorProcessed<Value, ErrorMeta> = $ReadOnly<{|
  ...FormError<ErrorMeta>,
  source: ErrorSource,
  valueSnapshot:
    | $ReadOnly<{|time: Time, fieldName: null, values: Values<Value>|}>
    | $ReadOnly<{|time: Time, fieldName: string, value: Value|}>,
|}>

export type Validator<Value, ErrorMeta> =
  | $ReadOnly<{|
      tag: "synchronous",
      fields: null | $ReadOnlyArray<string> | (string => boolean),
      id: string,
      validator: (Values<Value>) => $ReadOnlyArray<FormError<ErrorMeta>>,
    |}>
  | $ReadOnly<{|
      tag: "asynchronous",
      id: string,
      fields: null | $ReadOnlyArray<string> | (string => boolean),
      validator: (
        Values<Value>,
        CancellationTokenShim,
      ) => Promise<$ReadOnlyArray<FormError<ErrorMeta>> | void>,
    |}>

export type SubmitResult<SubmitMeta, ErrorMeta> = $ReadOnly<{|
  errors: $ReadOnlyArray<FormError<ErrorMeta>>,
  meta: SubmitMeta,
|}>

export type SubmitHandler<Value, SubmitMeta, ErrorMeta> = (
  FormApi<Value, SubmitMeta, ErrorMeta>,
  CancellationTokenShim,
) => Promise<SubmitResult<SubmitMeta, ErrorMeta> | void>

export type PendingSubmit<Value> = $ReadOnly<{|
  startTime: Time,
  values: Values<Value>,
|}>

export type ResolvedSubmit<Value, SubmitMeta, ErrorMeta> = $ReadOnly<{|
  ...PendingSubmit<Value>,
  endTime: Time,
  result: SubmitResult<SubmitMeta, ErrorMeta>,
|}>

export type PendingValidation<Value> = $ReadOnly<{|
  startTime: Time,
  values: Values<Value>,
|}>

export type ResolvedValidation<Value, ErrorMeta> = $ReadOnly<{|
  ...PendingValidation<Value>,
  endTime: Time,
  errors: $ReadOnlyArray<FormError<ErrorMeta>>,
|}>
