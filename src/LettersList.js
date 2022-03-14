import { Grid } from 'semantic-ui-react'
import LetterInfo from './LetterInfo'
import React from 'react'

export default function Main(props) {
  return (
    <Grid.Row>
    {props.letters.map((letter, index) => (
        <LetterInfo letter={letter} getIPFSDataFromContentID={(cid)=>props.getIPFSDataFromContentID(cid)}/>
    ))}
    </Grid.Row>);
}
