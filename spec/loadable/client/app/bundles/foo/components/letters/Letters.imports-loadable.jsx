import React from 'react'
// eslint-disable-next-line import/no-extraneous-dependencies
import loadable from '@loadable/component'
import './main.css'

const A = loadable(() => import('./A'))
const B = loadable(() => import('./B'))
const C = loadable(() => import(/* webpackPreload: true */ './C'))
const D = loadable(() => import(/* webpackPrefetch: true */ './D'))
const E = loadable(() => import('./E?param'), { ssr: false })
const X = loadable(props => import(`./${props.letter}`))
const Sub = loadable(props => import(`./${props.letter}/file`))

// Load the 'G' component twice: once in SSR and once fully client-side
const GClient = loadable(() => import('./G'), {
  ssr: false,
  fallback: <span className="loading-state">ssr: false - Loading...</span>,
})
const GServer = loadable(() => import('./G'), {
  ssr: true,
  fallback: <span className="loading-state">ssr: true - Loading...</span>,
})

// We keep some references to prevent uglify remove
A.C = C
A.D = D

const Moment = loadable.lib(() => import('moment'), {
  resolveComponent: moment => moment.default || moment,
})

const Letters = () => (
  <div>
    <A />
    <br />
    <B />
    <br />
    <X letter="A" />
    <br />
    <X letter="F" />
    <br />
    <E />
    <br />
    <GClient prefix="ssr: false" />
    <br />
    <GServer prefix="ssr: true" />
    <br />
    <Sub letter="Z" />
    <br />
    <Moment>{moment => moment().format('HH:mm')}</Moment>
  </div>
)

export default Letters
