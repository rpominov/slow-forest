// @flow

import * as React from "react"
import Form from "../../slow-forest/Form"
import * as submitResults from "../../slow-forest/submitResults"

function submitHandler(values, cb) {
  setTimeout(() => {
    cb(submitResults.success(), () => undefined)
  }, 3000)
}

function syncValidator(values) {
  if (values.name === "") {
    // TODO: need a contructor
    // TODO: we don't want to specify source here
    // TODO: meta should be optional
    return [
      {
        source: "synchronous",
        field: "name",
        message: "name is required",
        meta: undefined,
      },
    ]
  }
  return []
}

export default () => (
  <Form
    submitHandler={submitHandler}
    syncValidator={syncValidator}
    initialValues={{name: "", human: false, planet: "__unset__"}}
    render={formAPI => (
      <form onSubmit={formAPI.submitEventHandler}>
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

        <Submit label="Submit" />
      </form>
    )}
  />
)

const TextField = props => {
  const {formAPI, name, label} = props
  return (
    <div className="inputGroup">
      <label>{label}:</label>
      <input
        type="text"
        value={formAPI.getValue(name)}
        onChange={e => formAPI.setValue(name, e.target.value)}
      />
    </div>
  )
}

const RadioButtons = props => {
  const {formAPI, name, label, options} = props
  return (
    <div className="inputGroup">
      <label>{label}:</label>
      {options.map(option => (
        <label className="radioGroup" key={option.value}>
          <input
            type="radio"
            name={name}
            checked={formAPI.getValue(name) === option.value}
            onChange={() => formAPI.setValue(name, option.value)}
          />
          {option.label}
        </label>
      ))}
    </div>
  )
}

const Checkbox = props => {
  const {formAPI, name, label} = props
  return (
    <div className="inputGroup">
      <label>
        <input
          type="checkbox"
          checked={formAPI.getValue(name)}
          onChange={e => formAPI.setValue(name, e.target.checked)}
        />
        {label}
      </label>
    </div>
  )
}

const Select = props => {
  const {formAPI, name, label, options} = props
  return (
    <div className="inputGroup">
      <label>{label}:</label>
      <select
        value={formAPI.getValue(name)}
        onChange={e => formAPI.setValue(name, e.target.value)}
      >
        {options.map(option => (
          <option value={option.value} key={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

const Submit = props => {
  const {label} = props
  return (
    <div className="inputGroup">
      <button type="submit">{label}</button>
    </div>
  )
}
