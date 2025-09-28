import * as ts from 'typescript'
import { basicBlocks, type BasicBlock } from './bb'

export const play = (source: string): BasicBlock => {
  const file = ts.createSourceFile(
    'source.ts',
    source,
    ts.ScriptTarget.ES2024,
    /* setParentNodes */ true,
    ts.ScriptKind.TS,
  )

  return basicBlocks(file)
}
