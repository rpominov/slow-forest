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

export class CancellationSourceShim {
  _state: CancellationState
  _registrations: Array<Registration> | null
  token: CancellationTokenShim

  constructor() {
    this._state = "open"
    this._registrations = null
    this.token = new CancellationTokenShim(this)
  }

  cancel(): void {
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

  close(): void {
    if (this._state !== "open") {
      return
    }
    this._registrations = null
    this._state = "closed"
  }

  _register(callback: () => void): Registration {
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

  toJSON() {
    return ""
  }
}

export class CancellationTokenShim {
  _source: CancellationSourceShim

  constructor(source: CancellationSourceShim) {
    this._source = source
  }

  // flowlint-next-line unsafe-getters-setters:off
  get cancellationRequested(): boolean {
    return this._source._state === "cancellationRequested"
  }

  // flowlint-next-line unsafe-getters-setters:off
  get canBeCanceled(): boolean {
    return !this._source._state !== "closed"
  }

  register(callback: () => void): Registration {
    return this._source._register(callback)
  }

  // TODO
  toAbortSignal(): void {}

  toJSON() {
    return ""
  }
}
