import * as ts from 'typescript'

export const parse = (source: string) => {
  return ts.createSourceFile(
    'source.ts',
    source,
    ts.ScriptTarget.ES2024,
    /* setParentNodes */ true,
    ts.ScriptKind.TS,
  )
}
