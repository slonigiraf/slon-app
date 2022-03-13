import React, { useState } from 'react'
import { Form, Input, TextArea, Grid, Button } from 'semantic-ui-react'
import { useSubstrateState } from './substrate-lib'
import QRCode from 'qrcode.react';
import { sha256 } from 'js-sha256';
import { web3FromSource } from '@polkadot/extension-dapp'
import { sign, getPublicDataToSignByGuarantee , getPrivateDataToSignByGuarantee} from './helpers.mjs';
import { hexToU8a, u8aToHex } from '@polkadot/util';

export default function Main(props) {
  const { currentAccount } = useSubstrateState()
  const [status, setStatus] = useState(null)
  const [formState, setFormState] = useState({ letterInfo: '', text: '', workerPublicKeyHex: '', amount: 0 })

  const onChange = (_, data) =>
    setFormState(prev => ({ ...prev, [data.state]: data.value }))

  const { letterInfo, text, workerPublicKeyHex: workerPublicKeyHex, amount } = formState

  const { keyring } = useSubstrateState()
  const accounts = keyring.getPairs()

  const availableAccounts = []
  accounts.map(account => {
    return availableAccounts.push({
      key: account.meta.name,
      text: account.meta.name,
      value: account.address,
    })
  })

  const getLetterInfo = async () => {
    // skill_ipfs_hash , insurance_id , teach_address , stud_address , amount , teach_sign_1 , teach_sign_2
    let result = [];
    const textHash = sha256(text);
    result.push(textHash);
    //
    const letterId = getLetterId();
    result.push(letterId);
    //
    const [guarantee,] = await getFromAcct()
    const guaranteeU8 = guarantee.publicKey
    const guaranteePublicKeyHex = u8aToHex(guaranteeU8)
    result.push(guaranteePublicKeyHex)
    //
    const workerPublicKeyU8 = hexToU8a(workerPublicKeyHex)
    result.push(workerPublicKeyHex)
    //
    const amountValue = parseInt(amount, 10);
    result.push(amountValue);
    //
    const privateData = getPrivateDataToSignByGuarantee(textHash, letterId, guaranteeU8, workerPublicKeyU8, amountValue)
    const guaranteeSignOverPrivateData = u8aToHex( sign(guarantee, privateData) )
    result.push(guaranteeSignOverPrivateData);
    //
    
    const reciept = getPublicDataToSignByGuarantee(letterId, guaranteeU8, workerPublicKeyU8, amountValue)
    const guaranteeSignOverReceipt = u8aToHex( sign(guarantee, reciept) )
    console.log("letterId", letterId)
    console.log("guaranteeU8", guaranteeU8)
    console.log("workerPublicKeyU8", workerPublicKeyU8)
    console.log("amount",amount)
    console.log("reciept",reciept)
    console.log("guaranteeSignOverReceipt",guaranteeSignOverReceipt)

    result.push(guaranteeSignOverReceipt);
    //
    console.log(result);
    return result.join(",");
  }

  const getFromAcct = async () => {
    const {
      address,
      meta: { source, isInjected },
    } = currentAccount

    if (!isInjected) {
      return [currentAccount]
    }

    // currentAccount is injected from polkadot-JS extension, need to return the addr and signer object.
    // ref: https://polkadot.js.org/docs/extension/cookbook#sign-and-send-a-transaction
    const injector = await web3FromSource(source)
    return [address, { signer: injector.signer }]
  }

  const getLetterId = () => {
    const usedId = parseInt(window.localStorage.getItem('letterId')) || 0;
    const letterId = 1 + usedId;
    window.localStorage.setItem('letterId', letterId);
    return letterId;
  }

  const showQR = async () => {
    const data = await getLetterInfo();
    setStatus(true);
    setFormState({ ...formState, letterInfo: data });
  }

  const qrPart =  status? <Form.Field>
  <QRCode value={letterInfo} size="160"/>
  </Form.Field> : "";

  return (
    <Grid.Column width={8}>
      <h1>Create recommendation letter</h1>
      <Form>
        <Form.Field>
          <TextArea
            fluid
            type="text"
            placeholder="Recommendation letter text"
            value={text}
            state="text"
            onChange={onChange}
          />
        </Form.Field>
        <Form.Field>
          <Input
            fluid
            label="About person"
            type="text"
            placeholder="public key hex"
            value={workerPublicKeyHex}
            state="workerPublicKeyHex"
            onChange={onChange}
          />
        </Form.Field>
        <Form.Field>
          <Input
            fluid
            label="Stake reputation"
            type="number"
            state="amount"
            onChange={onChange}
          />
        </Form.Field>
        <Form.Field style={{ textAlign: 'center' }}>
          <Button
            setStatus={setStatus}
            onClick={() => {
              showQR();
            }}
          >Create</Button>
        </Form.Field>

        {qrPart}

        <div style={{ overflowWrap: 'break-word' }}>{status}</div>
      </Form>
    </Grid.Column>
  )
}
