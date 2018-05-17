// @flow

import type {SubmitResult, FormErrorsWithoutSource} from "./types"

export function success<Meta>(meta: Meta): SubmitResult<Meta, empty> {
  return {tag: "success", meta}
}

export function failure<Meta, ErrorMeta>(
  errors: FormErrorsWithoutSource<ErrorMeta>,
  meta: Meta,
): SubmitResult<Meta, ErrorMeta> {
  return {
    tag: "failure",
    errors: errors.map(e => ({...e, source: "submit"})),
    meta,
  }
}
