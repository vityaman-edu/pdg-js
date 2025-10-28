import * as ts from 'typescript'

export type Assignment
  = ts.VariableDeclaration
    | ts.BinaryExpression
    | ts.PostfixUnaryExpression

export interface Ddg {
  dependencies: Map<ts.Identifier, Set<Assignment>>
};

export const isAssignmentExpression = (node: ts.Node): node is ts.BinaryExpression => {
  return ts.isBinaryExpression(node)
    && node.operatorToken.kind == ts.SyntaxKind.FirstAssignment
    && ts.isIdentifier(node.left)
}

export const target = (assignment: Assignment): ts.Identifier => {
  if (ts.isVariableDeclaration(assignment) && ts.isIdentifier(assignment.name)) {
    return assignment.name
  }

  if (isAssignmentExpression(assignment)) {
    const expr = assignment
    return expr.left as ts.Identifier
  }

  throw Error('Unimplemented assignment kind')
}
