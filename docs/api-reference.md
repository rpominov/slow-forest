# API reference

There're two main artifacts in slow-forest API: the `Form` component and the
`formApi` object. The way it works, you pass a render function as a prop to
`<Form/>` and get a `formApi` object as an argument to your render function. The
API object allows you to read and change the form state, like getting and
setting values of fields, submitting the form etc. Here's how this looks:

```js
import React from "react"
import {Form} from "slow-forest"

function mySubmitHandler(formApi, callback) {
  // ...
}

const MyForm = () => (
  <Form
    initialValues={{name: ""}}
    submitHandler={mySubmitHandler}
    render={formApi => (
      <form onSubmit={formApi.submitEventHandler}>
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

<!-- toc -->

- [formApi methods](#formapi-methods)
  * [formApi.getValues()](#formapigetvalues)
  * [formApi.getValue(fieldName)](#formapigetvaluefieldname)
  * [formApi.setValue(fieldName, value)](#formapisetvaluefieldname-value)
  * [formApi.submit()](#formapisubmit)
  * [formApi.submitEventHandler(event)](#formapisubmiteventhandlerevent)
  * [formApi.cancelSubmit()](#formapicancelsubmit)
- [Form component props](#form-component-props)
  * [props.render](#propsrender)
  * [props.initialValues](#propsinitialvalues)
  * [props.submitHandler](#propssubmithandler)
  * [props.syncValidator](#propssyncvalidator)
- [SubmitResult constructors](#submitresult-constructors)
  * [submitResult.success()](#submitresultsuccess)
  * [submitResult.failure(errors)](#submitresultfailureerrors)

<!-- tocstop -->

## formApi methods

### formApi.getValues()

<!-- prettier-ignore -->
```js
// Type signature

(kind?: 'current' | 'initial' | 'submitted') => {[fieldName: string]: mixed}
```

TODO.

### formApi.getValue(fieldName)

Returns the current value of a field. You can also get initial or the value from
the last finished submit using the second argument.

<!-- prettier-ignore -->
```js
// Type signature

(fieldName: string, kind?: 'current' | 'initial' | 'submitted') => mixed
```

```js
// Example

<input ... value={formApi.getValue("foo")} />
```

### formApi.setValue(fieldName, value)

Changes the current value of a field.

<!-- prettier-ignore -->
```js
// Type signature

(fieldName: string, value: mixed) => void
```

```js
// Example

<input ... onChange={e => formApi.setValue("foo", e.target.value)} />
```

### formApi.submit()

Submits the form. See also [`props.submitHandler`](#propssubmithandler) for more
info on how submitting works.

<!-- prettier-ignore -->
```js
// Type signature

() => void
```

### formApi.submitEventHandler(event)

You can use this function as `onSubmit` prop on a `form` element. Same as
`formApi.submit()` but also calls `event.preventDefault()` on the submit event.

<!-- prettier-ignore -->
```js
// Type signature

(event: Event) => void
```

```js
// Example

<form onSubmit={formApi.submitEventHandler}> ... </form>
```

### formApi.cancelSubmit()

TODO.

## Form component props

### props.render

Your render function.

<!-- prettier-ignore -->
```js
// Type signature

(formApi: FormAPI) => React.Node
```

```js
// Example

<Form ... render={formApi => <form>...</form>} />
```

### props.initialValues

An object with field names as keys and initial field values as values.

<!-- prettier-ignore -->
```js
// Type signature

{[fieldName: string]: mixed}
```

```js
// Example

<Form ... initialValues={{foo: "bar"}} />
```

### props.submitHandler

A callback that gets called when you submit the form using `formApi.submit()`.
Accepts `formApi` and a callback that you call when submit is finished. The
provided callback expects a `SubmitResult` object that you can create using
[`submitResult.success()`](#submitresultsuccess) or
[`submitResult.failure()`](#submitresultfailureerrors).

The provided callback also accepts `afterSubmit` callback as an optional second
argument. We call `afterSubmit` after `<Form>`'s state is updated.

Submit handler may return a callback that cancels the submit. We'll call it when
a submit is interupted by another submit. Also you can cancel submit manually
using [`formApi.cancelSubmit()`](#formapicancelsubmit).

<!-- prettier-ignore -->
```js
// Type signature

(
  formApi: FormApi,
  callback: (result: SubmitResult, afterSubmit?: () => void) => void,
) => ?(() => void)
```

```js
// Example

import {Form, submitResult} from "slow-forest"

<Form ...
  submitHandler={(formApi, callback) => {
    const data = formApi.getValues()
    sendDataToTheServer(data).then(result =>
      callback(
        result.successful
          ? submitResult.success()
          : submitResult.failure(result.errors),
      ),
    )
  }}
/>
```

### props.syncValidator

TODO.

## SubmitResult constructors

### submitResult.success()

TODO.

### submitResult.failure(errors)

TODO.

```js
submitResult.failure([
  // a error related to phone field
  {field: "phone", message: "Please enter your phone"},

  // a error that isn't related to a particular field
  {message: "Passwords don't match"},
])
```
