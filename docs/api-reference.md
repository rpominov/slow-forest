# API reference

<!-- toc -->

* [Intro](#intro)
* [About type signatures](#about-type-signatures)
* [formApi methods](#formapi-methods)
  * [formApi.getInitialValues()](#formapigetinitialvalues)
  * [formApi.getInitializationTime()](#formapigetinitializationtime)
  * [formApi.setValue(fieldName, value)](#formapisetvaluefieldname-value)
  * [formApi.getValue(fieldName)](#formapigetvaluefieldname)
  * [formApi.getAllValues()](#formapigetallvalues)
  * [formApi.getValueUpdateTime(fieldName)](#formapigetvalueupdatetimefieldname)
  * [formApi.setTouched(fieldName, isTouched)](#formapisettouchedfieldname-istouched)
  * [formApi.isTouched(fieldName)](#formapiistouchedfieldname)
  * [formApi.submit()](#formapisubmit)
  * [formApi.cancelSubmit()](#formapicancelsubmit)
  * [formApi.getRunningSubmit()](#formapigetpendingsubmit)
  * [formApi.getResolvedSubmit()](#formapigetresolvedsubmit)
  * [formApi.reinitialize(initialValues)](#formapireinitializeinitialvalues)
* [Form props](#form-props)
  * [props.render](#propsrender)
  * [props.initialValues](#propsinitialvalues)
  * [props.submitHandler](#propssubmithandler)
  * [props.afterSubmit](#propsaftersubmit)
  * [props.validators](#propsvalidators)
  * [props.hasValueChanged](#propshasvaluechanged)
* [CancellationTokenShim](#cancellationtokenshim)
* [Other](#other)
  * [getTime()](#gettime)

<!-- tocstop -->

## Intro

There're two main artifacts in slow-forest API: the `Form` component and the
`formApi` object. The way it works, you pass a render function as a prop to
`<Form/>` and get a `formApi` object as an argument to your render function. The
API object allows you to read and change the form state: get and set values of
fields, submit the form etc. Here's how this looks:

```js
import React from "react"
import {Form} from "slow-forest"

const MyForm = () => (
  <Form
    initialValues={{name: ""}}
    submitHandler={async function(formApi) { ... }}
    render={formApi => (
      <form onSubmit={formApi.submit}>
        ...
        <input
          value={formApi.getValue("name")}
          onChange={e => formApi.setValue("name", e.target.value)}
        />
        ...
        <button type="submit">Submit</button>
      </form>
    )}
  />
)
```

## Type signatures

We use Flow for type signatures in this document, but if you're more familiar
with TypeScript you also should be able to read them pretty easily.

We use some types in multiple places and to not repeat them let's introduce
aliases here:

```js
// The object that we use to represent time
type Time = {time: number, count: number}

// You provide errors to the library in this format
type FormError<ErrorMeta> = {
  fieldName: string | null,
  message: string,
  meta: ErrorMeta,
}

// When you get errors from the library
// we automatically attach some usefull metadata to them
type FormErrorProcessed<Value, ErrorMeta> = {
  ...FormError<ErrorMeta>,
  source: {type: "submit"} | {type: "validator", id: string},
  valueSnapshot:
    | {time: Time, fieldName: null, values: {[fieldName: string]: Value}}
    | {time: Time, fieldName: string, value: Value},
}
```

Also, you'll notice three odd types: `Value`, `SubmitMeta`, and `ErrorMeta`.
These are type arguments of `Form` and `FormApi`:

```js
class Form<Value, SubmitMeta, ErrorMeta> extends React.Component<...> {
  ...
}

class FormAPI<Value, SubmitMeta, ErrorMeta> {
  ...
}
```

They correspond to any types you choose, but they have to be consistent for each
form instance. For example, if you call `formApi.setValue()` with strings and
numbers as second arguments, you should expect either string or number as a
return type of `formApi.getValue()`. So `Value` is the type that you use for
values in your form, the other two related to [submission](#TODO) and
[validation](#TODO).

## formApi methods

### formApi.getInitialValues()

TODO.

### formApi.getInitializationTime()

TODO.

### formApi.setValue(fieldName, value)

Changes the current value of a field.

<!-- prettier-ignore -->
```js
// Type signature

(fieldName: string, value: Value) => void
```

```js
// Example

<input ... onChange={e => formApi.setValue("foo", e.target.value)} />
```

### formApi.getValue(fieldName)

Returns the current value of a field. You can also get initial or the value from
the last finished submit using the second argument.

<!-- prettier-ignore -->
```js
// Type signature

(fieldName: string) => Value
```

```js
// Example

<input ... value={formApi.getValue("foo")} />
```

### formApi.getAllValues()

<!-- prettier-ignore -->
```js
// Type signature

() => {[fieldName: string]: Value}
```

TODO.

### formApi.getValueUpdateTime(fieldName)

TODO.

### formApi.setTouched(fieldName, isTouched)

TODO.

### formApi.isTouched(fieldName)

TODO.

### formApi.submit()

Submits the form. Returns a promise that resolves when submit is complete or
canceled. See also [`props.submitHandler`](#propssubmithandler) for more info on
how submitting works.

<!-- prettier-ignore -->
```js
// Type signature

() => Promise<void>
```

### formApi.cancelSubmit()

TODO.

### formApi.getRunningSubmit()

TODO.

### formApi.getResolvedSubmit()

TODO.

### formApi.reinitialize(initialValues)

TODO.

## Form props

### props.render

Your render function.

<!-- prettier-ignore -->
```js
// Type signature

(formApi: FormAPI<Value, SubmitMeta, ErrorMeta>) => React.Node
```

```js
// Example

<Form ... render={formApi => <form>...</form>} />
```

### props.initialValues

An object with field names as keys and initial values as values.

<!-- prettier-ignore -->
```js
// Type signature

{[fieldName: string]: Value}
```

```js
// Example

<Form ... initialValues={{foo: "bar"}} />
```

### props.submitHandler

A callback that gets called when you submit the form using `formApi.submit()`.

TODO.

<!-- prettier-ignore -->
```js
// Type signature

(
  formApi: FormApi,
  cancellationToken: CancellationTokenShim,
) => Promise<{errors: Array<FormError<ErrorMeta>>, meta: SubmitMeta}>
```

```js
// Example

// TODO
```

### props.afterSubmit

TODO.

### props.validators

TODO.

### props.hasValueChanged

TODO.

## CancellationTokenShim

TODO.

## Other

### getTime()

TODO.
