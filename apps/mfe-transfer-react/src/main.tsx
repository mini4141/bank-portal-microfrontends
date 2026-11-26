import React from 'react'
import * as ReactDOMClient from 'react-dom/client'
import singleSpaReact from 'single-spa-react'
import { trackWindowErrors } from './monitoring'
import TransferApp from './TransferApp'
import '@bank/ui/src/styles/tokens.css'
import './styles.scss'

trackWindowErrors()

export const { bootstrap, mount, unmount } = singleSpaReact({
  React,
  ReactDOMClient,
  rootComponent: TransferApp,
  errorBoundary: () => <p role="alert">Transfer is temporarily unavailable.</p>,
})
