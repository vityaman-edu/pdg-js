import * as ts from 'typescript'

function visit(node: ts.Node, indent = '', onNode: (indent: string, node: ts.Node) => void) {
  onNode(indent, node)
  ts.forEachChild(node, (child) => {
    visit(child, indent + '  ', onNode)
  })
}

export const play = (source: string) => {
  const file = ts.createSourceFile(
    'source.ts',
    source,
    ts.ScriptTarget.ES2024,
    /* setParentNodes */ true,
    ts.ScriptKind.TS,
  )

  let output = 'AST:\n'
  visit(file, /* indent: */ '', (indent, node) => {
    output += indent + ts.SyntaxKind[node.kind] + '\n'
  })
  return output
}
