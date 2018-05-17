// @flow

import * as React from "react"
import Head from "next/head"

type Props = {|
  children: React.Node,
|}

export default (props: Props) => (
  <div className="layoutWrap">
    <Head>
      <title>slow-forest</title>
    </Head>

    <style global jsx>{`
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        font-family: monospace;
        font-size: 16px;
        line-height: 1.2;
        font-weight: normal;
        color: black;
        background: white;
      }

      .layoutWrap {
        margin: 20px;
      }

      .inputGroup {
        margin-bottom: 20px;
      }

      .inputGroup > label {
        display: block;
        font-size: 14px;
        color: #6f72ad;
      }

      .inputGroup > input[type="text"],
      .inputGroup > select {
        border: solid 2px #e6e7ff;
        padding: 4px;
        display: block;
        color: #6f72ad;
        width: 100%;
        max-width: 300px;
      }

      .inputGroup input[type="radio"],
      .inputGroup input[type="checkbox"] {
        margin-right: 0.5em;
      }

      .inputGroup .radioGroup {
        display: inline-block;
        margin: 5px 20px 0 0;
      }

      .inputGroup button {
        border: none;
        background: #e6e7ff;
        padding: 15px 30px;
        cursor: pointer;
        color: #6f72ad;
      }
    `}</style>

    <style jsx>{`
      h1 {
        font-weight: bold;
        font-size: 24px;
        margin-bottom: 10px;
        color: #989ce6;
      }

      nav {
        margin: 0 -10px 40px;
      }

      nav ul {
        display: block;
      }

      nav li {
        display: inline-block;
        margin: 10px;
        background: #e6e7ff;
        padding: 3px 6px;
      }

      nav li.current {
        background: #4e52a1;
        color: white;
      }
    `}</style>

    <header>
      <h1># slow-forest examples</h1>
      <nav>
        <ul>
          <li>basic</li>
          <li className="current">sync validation</li>
          <li>submit validation</li>
          <li>async validation on blur</li>
          <li>async validation on submit</li>
          <li>async validation on change</li>
        </ul>
      </nav>
    </header>
    <main>{props.children}</main>
  </div>
)
