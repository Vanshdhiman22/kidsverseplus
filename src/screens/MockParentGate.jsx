import React from 'react'
import {useNavigate} from 'react-router-dom'
import Page from '../components/Page.jsx'
import Scene from '../components/Scene.jsx'
import ParentGate from '../components/ParentGate.jsx'
export default function MockParentGate(){const nav=useNavigate();return <Page><Scene name="parent"/><ParentGate onPass={()=>nav('/parent?mockScreen=60')} onCancel={()=>nav('/home')}/></Page>}
