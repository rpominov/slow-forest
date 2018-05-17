// @flow

export default function delay<T>(t: number, x: T): Promise<T> {
  return new Promise(cb => {
    setTimeout(() => cb(x), t)
  })
}
