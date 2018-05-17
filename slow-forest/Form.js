// @flow

import * as React from "react"
import getTime from "./getTime"
import FormAPI from "./FormApi"
import type {
  Time,
  Values,
  SubmitHandler,
  SubmitState,
  SubmitResult,
  SyncValidator,
  FormErrors,
} from "./types"

type Props = {|
  render: FormAPI => React.Node,
  initialValues: Values,
  submitHandler: SubmitHandler<any, any>,
  syncValidator?: SyncValidator<any>,
|}

type State = {|
  initialValues: Values,
  currentValues: Values,
  valuesUpdateTime: {[k: string]: Time},
  submits: $ReadOnlyArray<SubmitState<any, any>>,
  syncErrors: FormErrors<any>,
|}

export default class Form extends React.Component<Props, State> {
  api: FormAPI
  state: State

  constructor(props: Props) {
    super(props)
    this.api = new FormAPI(this)
    this.api.initializeState(props)
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
