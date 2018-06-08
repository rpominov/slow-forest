// @flow

import * as React from "react"
import Form from "../../slow-forest/Form"

function sleep(time) {
  return new Promise(resolve => setTimeout(resolve, time))
}

async function submitHandler(formApi) {
  const values = formApi.getAllValues()

  await sleep(1000)

  if (values.name === "") {
    return {
      errors: [
        {
          fieldNames: ["name"],
          message: "I told you name is required.",
          meta: undefined,
        },
      ],
      meta: null,
    }
  }

  return {errors: [], meta: null}
}

function syncValidator(values) {
  const errors = []

  if (values.name === "") {
    errors.push({
      fieldNames: ["name"],
      message: "Name is required.",
      meta: undefined,
    })
  }

  if (values.pet === "cat" && values.planet !== "pluto") {
    errors.push({
      fieldNames: {unknownField: true},
      message: "If you like cats, you must also like Pluto.",
      meta: undefined,
    })
  }
  return errors
}

function asyncValidator(formApi, requests) {
  return requests.map(request => {
    if (request.validationKind === "valid-name") {
      if (
        !Array.isArray(request.applyToFields) ||
        request.applyToFields.length !== 1
      ) {
        throw new Error("invalid validation request")
      }

      const errors =
        formApi.getValue(request.applyToFields[0]) === ""
          ? [
              {
                fieldNames: ["name"],
                message: "Name is required (async).",
                meta: undefined,
              },
            ]
          : []
      return sleep(1000).then(() => errors)
    }

    throw new Error("unknown validationKind")
  })
}

export default () => (
  <Form
    submitHandler={submitHandler}
    initialValues={{name: "", human: false, planet: "__unset__"}}
    syncValidator={syncValidator}
    asyncValidator={asyncValidator}
    render={formApi => (
      <form onSubmit={formApi.submit}>
        <TextField
          formApi={formApi}
          name="name"
          label="Name"
          validate={["valid-name"]}
        />

        <RadioButtons
          formApi={formApi}
          name="pet"
          label="Pet preference"
          options={[
            {value: "dog", label: "dogs"},
            {value: "cat", label: "cats"},
          ]}
        />

        <Checkbox formApi={formApi} name="human" label="human" />

        <Select
          formApi={formApi}
          name="planet"
          label="Favorite planet"
          options={[
            {value: "__unset__", label: ""},
            {value: "earth", label: "Earth"},
            {value: "mars", label: "Mars"},
            {value: "pluto", label: "Pluto"},
          ]}
        />

        <Submit formApi={formApi} label="Submit" />
      </form>
    )}
  />
)

const TextField = props => {
  const {formApi, name, label, validate} = props
  const value = formApi.getValue(name)
  const onChange = e => {
    formApi.setValue(name, e.target.value)
    if (validate !== undefined) {
      validate.forEach(validationKind => {
        formApi.requestAsyncValidation(validationKind, [name])
      })
    }
  }
  const onBlur = () => {
    formApi.setTouched(name)
    formApi.performAsyncValidations(name)
  }
  const errors = formApi.getErrors(name)
  const invalid = errors.length > 0
  return (
    <div className={"inputGroup" + (invalid ? " invalid" : "")}>
      <label>{label}:</label>
      <input type="text" value={value} onChange={onChange} onBlur={onBlur} />
      {invalid && formApi.isTouched(name) && <Errors errors={errors} />}
      <ValidationState formApi={formApi} name={name} />
    </div>
  )
}

const RadioButtons = props => {
  const {formApi, name, label, options} = props
  const errors = formApi.getErrors(name)
  const invalid = errors.length > 0
  return (
    <div className={"inputGroup" + (invalid ? " invalid" : "")}>
      <label>{label}:</label>
      {options.map(option => {
        const checked = formApi.getValue(name) === option.value
        const onChange = () => {
          formApi.setValue(name, option.value)
          formApi.setTouched(name)
          formApi.performAsyncValidations(name)
        }
        return (
          <label className="radioGroup" key={option.value}>
            <input
              type="radio"
              name={name}
              checked={checked}
              onChange={onChange}
            />
            {option.label}
          </label>
        )
      })}
      {invalid && formApi.isTouched(name) && <Errors errors={errors} />}
    </div>
  )
}

const Checkbox = props => {
  const {formApi, name, label} = props
  const checked = formApi.getValue(name)
  const onChange = e => {
    formApi.setValue(name, e.target.checked)
    formApi.setTouched(name)
    formApi.performAsyncValidations(name)
  }
  const errors = formApi.getErrors(name)
  const invalid = errors.length > 0
  return (
    <div className={"inputGroup" + (invalid ? " invalid" : "")}>
      <label>
        <input type="checkbox" checked={checked} onChange={onChange} />
        {label}
      </label>
      {invalid && formApi.isTouched(name) && <Errors errors={errors} />}
    </div>
  )
}

const Select = props => {
  const {formApi, name, label, options} = props
  const value = formApi.getValue(name)
  const onChange = e => {
    formApi.setValue(name, e.target.value)
  }
  const onBlur = () => {
    formApi.setTouched(name)
    formApi.performAsyncValidations(name)
  }
  const errors = formApi.getErrors(name)
  const invalid = errors.length > 0
  return (
    <div className={"inputGroup" + (invalid ? " invalid" : "")}>
      <label>{label}:</label>
      <select value={value} onChange={onChange} onBlur={onBlur}>
        {options.map(o => (
          <option value={o.value} key={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {invalid && formApi.isTouched(name) && <Errors errors={errors} />}
    </div>
  )
}

const Submit = props => {
  const {formApi, label} = props
  const errors = formApi.getErrors({unknownField: true})
  const invalid = errors.length > 0
  return (
    <div className={"inputGroup" + (invalid ? " invalid" : "")}>
      <button type="submit">
        {label}
        {formApi.getRunningSubmit() === null ? "" : "..."}
      </button>
      {invalid &&
        formApi.getTouchedFields().length !== 0 && <Errors errors={errors} />}
    </div>
  )
}

const Errors = props => {
  return (
    <ul className="errors">
      {props.errors.map((e, i) => <li key={i}>{e.message}</li>)}
    </ul>
  )
}

const ValidationState = props => {
  return (
    <p className="validation-state">
      {props.formApi.isAwaitingValidation(props.name) && "awaiting validation"}
      {props.formApi.isValidating(props.name) && "checking..."}
    </p>
  )
}
