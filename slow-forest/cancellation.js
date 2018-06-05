// @flow

class Registration {
  _callback: (() => void) | null

  constructor(callback: () => void) {
    this._callback = callback
  }

  unregister(): void {
    this._callback = null
  }
}

const emptyRegistration = new Registration(() => undefined)
emptyRegistration.unregister()

type CancellationState = "open" | "cancellationRequested" | "closed"

export class CancellationTokenShim {
  _state: CancellationState
  _registrations: Array<Registration> | null

  constructor() {
    this._state = "open"
    this._registrations = null
  }

  // flowlint-next-line unsafe-getters-setters:off
  get cancellationRequested(): boolean {
    return this._state === "cancellationRequested"
  }

  // flowlint-next-line unsafe-getters-setters:off
  get canBeCanceled(): boolean {
    return !this._state !== "closed"
  }

  register(callback: () => void): Registration {
    if (this._state === "closed") {
      return emptyRegistration
    }

    if (this._state === "cancellationRequested") {
      callback()
      return emptyRegistration
    }

    const registration = new Registration(callback)
    if (this._registrations === null) {
      this._registrations = []
    }
    this._registrations.push(registration)
    return registration
  }

  // TODO
  toAbortSignal(): void {}

  _cancel(): void {
    if (this._state !== "open") {
      return
    }
    const registrations = this._registrations
    this._registrations = null
    if (registrations !== null) {
      for (const registration of registrations) {
        const {_callback} = registration
        if (_callback !== null) {
          _callback()
        }
      }
    }
    this._state = "cancellationRequested"
  }

  _close(): void {
    if (this._state !== "open") {
      return
    }
    this._registrations = null
    this._state = "closed"
  }

  toString() {
    return "[CancellationTokenShim]"
  }

  toJSON() {
    return this.toString()
  }
}
