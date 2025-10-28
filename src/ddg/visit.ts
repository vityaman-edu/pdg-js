import ts from 'typescript'
import { isAssignmentExpression } from './core'

export const referencedVariables = (node: ts.Expression): ts.Identifier[] => {
  const ids: ts.Identifier[] = []

  const visitExpression = (node: ts.Node) => {
    if (isAssignmentExpression(node)) {
      throw Error(`assignment expression is unsupported`)
    }

    if (ts.isIdentifier(node)) {
      ids.push(node)
      return
    }

    node.forEachChild(visitExpression)
  }

  visitExpression(node)
  return ids
}

export const visitExpressionVariables = (
  node: ts.Expression | undefined,
  visit: (id: ts.Identifier) => void,
) => {
  if (node == undefined) {
    return
  }

  referencedVariables(node).forEach((node) => {
    visit(node)
  })
}

export const visitSimpleStatementVariables = (
  node: ts.Node,
  visit: (id: ts.Identifier) => void,
) => {
  if (ts.isVariableDeclarationList(node)) {
    node.declarations.forEach((declaration) => {
      visitExpressionVariables(declaration.initializer, visit)
    })
  }
  else if (ts.isVariableStatement(node)) {
    node.declarationList.declarations.forEach((declaration) => {
      visitExpressionVariables(declaration.initializer, visit)
    })
  }
  else if (ts.isExpressionStatement(node) && isAssignmentExpression(node.expression)) {
    visitExpressionVariables(node.expression.right, visit)
  }
  else if (ts.isExpressionStatement(node)
    && ts.isBinaryExpression(node.expression)
    && ts.isIdentifier(node.expression.left)
    && (node.expression.operatorToken.kind == ts.SyntaxKind.PlusEqualsToken
      || node.expression.operatorToken.kind == ts.SyntaxKind.MinusEqualsToken)) {
    visitExpressionVariables(node.expression.right, visit)
    visitExpressionVariables(node.expression.left, visit)
  }
  else if (ts.isPostfixUnaryExpression(node)) {
    visitExpressionVariables(node.operand, visit)
  }
}
