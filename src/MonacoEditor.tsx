import { Editor } from '@monaco-editor/react'

export const MonacoEditor = ({ onChange }: { onChange?: (value: string | undefined) => void }) => {
  return (
    <Editor
      height="80vh"
      width="80vh"
      defaultLanguage="typescript"
      defaultValue="// some comment"
      onChange={onChange}
    />
  )
}
