// @flow

export type Time = $ReadOnly<{|time: number, count: number|}>

export type FormErrorWithoutSource<Meta> = $ReadOnly<{|
  field: string | null,
  message: string,
  meta: Meta,
|}>

export type FormError<Meta> = $ReadOnly<{|
  source: "synchronous" | "asynchronous" | "submit",
  ...FormErrorWithoutSource<Meta>,
|}>

export type FormErrors<Meta> = $ReadOnlyArray<FormError<Meta>>

export type FormErrorsWithoutSource<Meta> = $ReadOnlyArray<
  FormErrorWithoutSource<Meta>,
>

export type SyncValidator<Meta> = Values => FormErrors<Meta>

export type Values = $ReadOnly<{[k: string]: mixed}>

export type SubmitResult<Meta, ErrorsMeta> =
  | $ReadOnly<{|tag: "success", meta: Meta|}>
  | $ReadOnly<{|tag: "failure", errors: FormErrors<ErrorsMeta>, meta: Meta|}>

export type CancelSubmit = void | null | (() => void)

export type SubmitHandler<Meta, ErrorsMeta> = (
  formData: Values,
  onResult: (SubmitResult<Meta, ErrorsMeta>, afterSubmit: () => void) => void,
) => CancelSubmit

export type SubmitResolution<Meta, ErrorsMeta> =
  | $ReadOnly<{|t: "canceled", time: Time|}>
  | $ReadOnly<{|
      t: "finished",
      time: Time,
      result: SubmitResult<Meta, ErrorsMeta>,
    |}>

export type SubmitState<Meta, ErrorsMeta> = $ReadOnly<{|
  startTime: Time,
  values: Values,
  resolution: null | SubmitResolution<Meta, ErrorsMeta>,
|}>
