// @flow

import * as React from "react"
import getTime from "./getTime"
import FormAPI from "./FormApi"
import type {
  Time,
  Values,
  SubmitHandler,
  UnresolvedSubmit,
  ResolvedSubmit,
  SubmitResult,
  Validator,
  FormErrorDecorated,
} from "./types"

type Props<Value, SubmitMeta, ErrorMeta> = {|
  render: (FormAPI<Value, SubmitMeta, ErrorMeta>) => React.Node,
  initialValues?: Values<Value>,
  submitHandler?: SubmitHandler<Value, SubmitMeta, ErrorMeta>,
  validators?: $ReadOnlyArray<Validator<Value, ErrorMeta>>,
|}

type State<Value, SubmitMeta, ErrorMeta> = {|
  initialValues: Values<Value>,
  currentValues: Values<Value>,
  valuesUpdateTime: {[k: string]: Time},
  pendingSubmit: UnresolvedSubmit | null,
  lastResolvedSubmit: ResolvedSubmit<SubmitMeta, ErrorMeta> | null,
  errors: $ReadOnlyArray<FormErrorDecorated<ErrorMeta>>,
|}

export default class Form<Value, SubmitMeta, ErrorMeta> extends React.Component<
  Props<Value, SubmitMeta, ErrorMeta>,
  State<Value, SubmitMeta, ErrorMeta>,
> {
  api: FormAPI<Value, SubmitMeta, ErrorMeta>
  state: State<Value, SubmitMeta, ErrorMeta>

  constructor(props: Props<Value, SubmitMeta, ErrorMeta>) {
    super(props)
    this.api = new FormAPI(this)
    this.api._initializeState(props)
  }

  render() {
    return (
      <div>
        {this.props.render(this.api)}
        <hr />
        <pre>{JSON.stringify(this.state, null, 2)}</pre>
      </div>
    )
  }
}
