// @flow

import type {SubmitResult, FormError} from "./types"

export function success<SubmitMeta>(
  meta: SubmitMeta,
): SubmitResult<SubmitMeta, any> {
  return {tag: "success", meta}
}

export function failure<SubmitMeta, ErrorMeta>(
  errors: $ReadOnlyArray<FormError<ErrorMeta>>,
  meta: SubmitMeta,
): SubmitResult<SubmitMeta, ErrorMeta> {
  return {tag: "failure", errors, meta}
}
