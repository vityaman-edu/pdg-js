import * as ts from 'typescript'

export const buildAst = (source: string): ts.SourceFile => {
  return ts.createSourceFile(
    'source.ts',
    source,
    ts.ScriptTarget.ES2024,
    /* setParentNodes */ true,
    ts.ScriptKind.TS,
  )
}
