// @flow

import type {Time} from "./types"

let counter = 0

export default function getTime(): Time {
  counter++
  return {
    time: new Date().getTime(),
    count: counter,
  }
}
