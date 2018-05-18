# API reference

There're two main artifacts in slow-forest API: the `Form` component and the
`formApi` object. The way it works, you pass a render function as a prop to
`<Form/>` and get a `formApi` object as an argument to your render function. The
API object allows you to read and change the form state, like getting and
setting values of fields, submitting the form etc. Here's how this looks:

```js
import React from "react"
import Form from "slow-forest"

function mySubmitHandler(values) {
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

## `formApi.getValue()`

`(fieldName: string) => mixed`

Returns the current value of a field.

## `formApi.setValue()`

`(fieldName: string, value: mixed) => void`

Changes the current value of a field.

## `formApi.submit()`

`() => void`

Submits the form.

## `formApi.submitEventHandler()`

`(e: Event) => void`

You can use this function as `onSubmit` prop on a `form` element. Same as
`formApi.submit()` but also calls `e.preventDefault()` on the submit event.
