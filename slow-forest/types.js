// @flow

import FormApi from "./FormApi"

export type Time = $ReadOnly<{|time: number, count: number|}>

export type Values<Value> = $ReadOnly<{[k: string]: Value}>

export type FormError<ErrorMeta> = $ReadOnly<{|
  field: string | null,
  message: string,
  meta: ErrorMeta,
|}>

export type FormErrorDecorated<ErrorMeta> =
  | $ReadOnly<{|
      source: "submit",
      time: Time,
      common: FormError<ErrorMeta>,
    |}>
  | $ReadOnly<{|
      source: "synchronous",
      validator: string,
      time: Time,
      common: FormError<ErrorMeta>,
    |}>
  | $ReadOnly<{|
      source: "asynchronous",
      validator: string,
      time: Time,
      common: FormError<ErrorMeta>,
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
  Values<Value>,
  SubmitResult<SubmitMeta, ErrorMeta>,
>

export type UnresolvedSubmit = $ReadOnly<{|
  startTime: Time,
|}>

export type ResolvedSubmit<SubmitMeta, ErrorMeta> = $ReadOnly<{|
  startTime: Time,
  endTime: Time,
  result: SubmitResult<SubmitMeta, ErrorMeta>,
|}>
