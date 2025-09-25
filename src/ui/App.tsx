import { useState } from 'react'
import { play } from '../pdg/playground'
import { MonacoEditor } from './MonacoEditor'
import './App.css'

export const App = () => {
  const [source, setSource] = useState('// some comment')

  return (
    <div className="app-container">
      <div className="editor-container">
        <h2>Editor</h2>
        <MonacoEditor onChange={(value) => { setSource(value ?? '') }} />
      </div>
      <div className="content-container">
        <h2>Content</h2>
        <pre>{play(source)}</pre>
      </div>
    </div>
  )
}

export default App
