// @flow

import App, {Container} from "next/app"
import Head from "next/head"
import Link from "next/link"
import * as React from "react"

const MenuItem = p => (
  <li className={p.isCurrent ? "current" : ""}>
    <style jsx>{`
      li {
        display: inline-block;
        margin: 10px;
      }

      a {
        display: block;
        background: #e6e7ff;
        padding: 3px 6px;
        text-decoration: none;
      }

      .current a {
        background: #4e52a1;
        color: white;
      }
    `}</style>
    <Link href={p.href}>
      <a>{p.children}</a>
    </Link>
  </li>
)

export default class MyApp extends App {
  // flowlint-next-line unclear-type:off
  static async getInitialProps({Component, router, ctx}: any) {
    let pageProps = {}

    if (Component.getInitialProps) {
      pageProps = await Component.getInitialProps(ctx)
    }

    return {pageProps}
  }

  render() {
    const {Component, pageProps, router} = this.props
    return (
      <Container>
        <div className="layoutWrap">
          <Head>
            <title>slow-forest</title>
          </Head>

          <style global jsx>{`
            html {
              font-family: monospace;
              font-size: 16px;
              line-height: 1.2;
              font-weight: normal;
              color: black;
              background: transparent;
            }

            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              font-family: inherit;
              font-size: inherit;
              line-height: inherit;
              font-weight: inherit;
              color: inherit;
              background: inherit;
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

            .errors {
              display: block;
              color: red;
              font-size: 14px;
            }
            .errors li {
              display: block;
              margin: 2px 0;
            }

            .validation-state {
              font-size: 14px;
              color: #939393;
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
          `}</style>

          <header>
            <h1># slow-forest examples</h1>
            <nav>
              <ul>
                {[
                  ["/basic", "basic"],
                  ["/sync-validation", "sync validation"],
                  ["/submit-validation", "submit validation"],
                  ["/todo", "async validation on blur"],
                  ["/todo", "async validation on submit"],
                  ["/todo", "async validation on change"],
                ].map(x => (
                  <MenuItem
                    key={x[0]}
                    href={x[0]}
                    isCurrent={router.route === x[0]}
                  >
                    {x[1]}
                  </MenuItem>
                ))}
              </ul>
            </nav>
          </header>
          <main>
            <Component {...pageProps} />
          </main>
        </div>
      </Container>
    )
  }
}
