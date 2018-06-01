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
          fieldName: "name",
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
      fieldName: "name",
      message: "Name is required.",
      meta: undefined,
    })
  }

  if (values.pet === "cat" && values.planet !== "pluto") {
    errors.push({
      fieldName: null,
      message: "If you like cats, you must also like Pluto.",
      meta: undefined,
    })
  }
  return errors
}

export default () => (
  <Form
    submitHandler={submitHandler}
    validators={[
      {tag: "synchronous", id: "0", fields: null, validator: syncValidator},
    ]}
    initialValues={{name: "", human: false, planet: "__unset__"}}
    render={formAPI => (
      <form onSubmit={formAPI.submit}>
        <TextField formAPI={formAPI} name="name" label="Name" />

        <RadioButtons
          formAPI={formAPI}
          name="pet"
          label="Pet preference"
          options={[
            {value: "dog", label: "dogs"},
            {value: "cat", label: "cats"},
          ]}
        />

        <Checkbox formAPI={formAPI} name="human" label="human" />

        <Select
          formAPI={formAPI}
          name="planet"
          label="Favorite planet"
          options={[
            {value: "__unset__", label: ""},
            {value: "earth", label: "Earth"},
            {value: "mars", label: "Mars"},
            {value: "pluto", label: "Pluto"},
          ]}
        />

        <Submit formAPI={formAPI} label="Submit" />
      </form>
    )}
  />
)

const TextField = props => {
  const {formAPI, name, label} = props
  const value = formAPI.getValue(name)
  const onChange = e => formAPI.setValue(name, e.target.value)
  const errors = formAPI.getErrors(name)
  const invalid = errors.length > 0
  return (
    <div className={"inputGroup" + (invalid ? " invalid" : "")}>
      <label>{label}:</label>
      <input type="text" value={value} onChange={onChange} />
      {invalid && <Errors errors={errors} />}
    </div>
  )
}

const RadioButtons = props => {
  const {formAPI, name, label, options} = props
  const errors = formAPI.getErrors(name)
  const invalid = errors.length > 0
  return (
    <div className={"inputGroup" + (invalid ? " invalid" : "")}>
      <label>{label}:</label>
      {options.map(option => {
        const checked = formAPI.getValue(name) === option.value
        const onChange = () => formAPI.setValue(name, option.value)
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
      {invalid && <Errors errors={errors} />}
    </div>
  )
}

const Checkbox = props => {
  const {formAPI, name, label} = props
  const checked = formAPI.getValue(name)
  const onChange = e => formAPI.setValue(name, e.target.checked)
  const errors = formAPI.getErrors(name)
  const invalid = errors.length > 0
  return (
    <div className={"inputGroup" + (invalid ? " invalid" : "")}>
      <label>
        <input type="checkbox" checked={checked} onChange={onChange} />
        {label}
      </label>
      {invalid && <Errors errors={errors} />}
    </div>
  )
}

const Select = props => {
  const {formAPI, name, label, options} = props
  const value = formAPI.getValue(name)
  const onChange = e => formAPI.setValue(name, e.target.value)
  const errors = formAPI.getErrors(name)
  const invalid = errors.length > 0
  return (
    <div className={"inputGroup" + (invalid ? " invalid" : "")}>
      <label>{label}:</label>
      <select value={value} onChange={onChange}>
        {options.map(o => (
          <option value={o.value} key={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {invalid && <Errors errors={errors} />}
    </div>
  )
}

const Submit = props => {
  const {formAPI, label} = props
  const errors = formAPI.getErrors(null)
  const invalid = errors.length > 0
  return (
    <div className={"inputGroup" + (invalid ? " invalid" : "")}>
      <button type="submit">{label}</button>
      {invalid && <Errors errors={errors} />}
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
