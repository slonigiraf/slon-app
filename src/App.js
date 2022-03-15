import React, { createRef, useState } from 'react'
import {
  Container,
  Dimmer,
  Loader,
  Grid,
  Sticky,
  Message,
  Tab,
} from 'semantic-ui-react'
import 'semantic-ui-css/semantic.min.css'

import { SubstrateContextProvider, useSubstrateState } from './substrate-lib'
import { DeveloperConsole } from './substrate-lib/components'

import AccountSelector from './AccountSelector'
import Balances from './Balances'
import Transfer from './Transfer'
import CreateLetter from './CreateLetter'
import WorkerSaveLetter from './WorkerSaveLetter'
import EmployerSaveLetter from './EmployerSaveLetter'
import { create } from 'ipfs-core'

function Main() {
  const { apiState, apiError, keyringState } = useSubstrateState()
  const [ipfs, setIpfs] = useState(null)

  const getIPFSNode = async () => {
    let node = ipfs;
    if (!ipfs) {
      console.log('Creating IPFS node...')
      node = await create({
        repo: String(Math.random() + Date.now()),
        init: { alogorithm: 'ed25519' }
      })
      setIpfs(node)
    }
    return node
  }

  const getIPFSContentID = async (content) => {
    let node = await getIPFSNode()
    const file = await node.add(content)
    return file.cid
  }

  const getIPFSDataFromContentID = async (cid) => {
    const text = []
    const node = await getIPFSNode()
    for await (const chunk of node.cat(cid)) {
      text.push(chunk)
    }
    return text.toString()
  }

  const loader = text => (
    <Dimmer active>
      <Loader size="small">{text}</Loader>
    </Dimmer>
  )

  const message = errObj => (
    <Grid centered columns={2} padded>
      <Grid.Column>
        <Message
          negative
          compact
          floating
          header="Error Connecting to Substrate"
          content={`Connection to websocket '${errObj.target.url}' failed.`}
        />
      </Grid.Column>
    </Grid>
  )

  if (apiState === 'ERROR') return message(apiError)
  else if (apiState !== 'READY') return loader('Connecting to Substrate')

  if (keyringState !== 'READY') {
    return loader(
      "Loading accounts (please review any extension's authorization)"
    )
  }

  const contextRef = createRef()

  const panes = [
    { menuItem: 'Guarantee', render: () => <Tab.Pane><CreateLetter getIPFSContentID={(content) => getIPFSContentID(content)} /></Tab.Pane> },
    { menuItem: 'Worker', render: () => <Tab.Pane><WorkerSaveLetter getIPFSDataFromContentID={(cid) => getIPFSDataFromContentID(cid)} /></Tab.Pane> },
    { menuItem: 'Employer', render: () => <Tab.Pane><EmployerSaveLetter getIPFSDataFromContentID={(cid) => getIPFSDataFromContentID(cid)} /></Tab.Pane> },

  ]
  const SelectARole = () => <Tab panes={panes} />

  return (
    <div ref={contextRef}>
      <Sticky context={contextRef}>
        <AccountSelector />
      </Sticky>
      <Container>
        <Grid stackable columns="equal">
          <Grid.Row><h1>Recommendation letters</h1></Grid.Row>
          <Grid.Row>
            <SelectARole />
          </Grid.Row>
          <Grid.Row stretched>
            <Balances />
          </Grid.Row>
          <Grid.Row>
            <Transfer />
          </Grid.Row>
        </Grid>
      </Container>
      <DeveloperConsole />
    </div>
  )
}

export default function App() {
  return (
    <SubstrateContextProvider>
      <Main />
    </SubstrateContextProvider>
  )
}
