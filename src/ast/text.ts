import * as ts from 'typescript'

export const printAst = (ast: ts.SourceFile): string => {
  let output = ''
  let indent = ''

  const visit = (node: ts.Node) => {
    output += `${indent}${ts.SyntaxKind[node.kind]}\n`
    node.forEachChild((node) => {
      indent += ' '
      visit(node)
      indent = indent.slice(0, indent.length - 1)
    })
  }

  visit(ast)
  return output
}
