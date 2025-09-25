import { Editor } from '@monaco-editor/react'
import { useState } from 'react'

export const MonacoEditor = () => {
  const [value, setValue] = useState('// some comment')

  return (
    <div>
      <Editor
        height="64vh"
        width="64vh"
        defaultLanguage="typescript"
        defaultValue={value}
        onChange={(value) => { setValue(value ?? '') }}
      />
    </div>
  )
}
