// @flow

import FormApi from "./FormApi"

export type Time = $ReadOnly<{|time: number, count: number|}>

export type Values<Value> = $ReadOnly<{[k: string]: Value}>

export type FormError<ErrorMeta> = $ReadOnly<{|
  fieldName: string | null,
  message: string,
  meta: ErrorMeta,
|}>

export type FormErrorProcessed<Value, ErrorMeta> =
  | $ReadOnly<{|
      source: "submit",
      time: Time,
      fieldValue: Value | void,
      ...FormError<ErrorMeta>,
    |}>
  | $ReadOnly<{|
      source: "synchronous",
      validator: string,
      time: Time,
      fieldValue: Value | void,
      ...FormError<ErrorMeta>,
    |}>
  | $ReadOnly<{|
      source: "asynchronous",
      validator: string,
      time: Time,
      fieldValue: Value | void,
      ...FormError<ErrorMeta>,
    |}>

export type Canceler = void | null | (() => void)

export type AsyncFunction<-Input, +Output> = (
  Input,
  (Output, cb?: () => void) => void,
) => Canceler

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
      validator: AsyncFunction<
        Values<Value>,
        $ReadOnlyArray<FormError<ErrorMeta>>,
      >,
    |}>

export type SubmitResult<SubmitMeta, ErrorMeta> =
  | $ReadOnly<{|tag: "success", meta: SubmitMeta|}>
  | $ReadOnly<{|
      tag: "failure",
      errors: $ReadOnlyArray<FormError<ErrorMeta>>,
      meta: SubmitMeta,
    |}>

export type SubmitHandler<Value, SubmitMeta, ErrorMeta> = AsyncFunction<
  FormApi<Value, SubmitMeta, ErrorMeta>,
  SubmitResult<SubmitMeta, ErrorMeta>,
>

export type PendingSubmit<Value> = $ReadOnly<{|
  startTime: Time,
  values: Values<Value>,
|}>

export type ResolvedSubmit<Value, SubmitMeta, ErrorMeta> = $ReadOnly<{|
  ...PendingSubmit<Value>,
  endTime: Time,
  result: SubmitResult<SubmitMeta, ErrorMeta>,
|}>
