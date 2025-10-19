import ts from 'typescript'
import { isAssignmentExpression, type Ddg } from './core'
import { Scope } from './scope'

export const buildDdg = (node: ts.SourceFile): Ddg => {
  const ddg: Ddg = { requirements: new Map() }
  const scope = new Scope()

  const visitExpression = (node: ts.Node | undefined) => {
    if (node == undefined) {
      return
    }

    if (isAssignmentExpression(node)) {
      throw Error(`assignment expression is unsupported`)
    }

    if (ts.isIdentifier(node)) {
      const requirement = scope.lookup(node.text)
      if (requirement != undefined) {
        ddg.requirements.set(node, requirement)
      }

      return
    }

    node.forEachChild(visitExpression)
  }

  const visitStatement = (statement: ts.Node) => {
    if (ts.isVariableStatement(statement)) {
      statement.declarationList.declarations.forEach((declaration) => {
        visitExpression(declaration.initializer)
        scope.visit(declaration)
      })
    }
    else if (ts.isExpressionStatement(statement)
      && isAssignmentExpression(statement.expression)) {
      const expr = statement.expression

      visitExpression(expr.right)
      scope.visit(expr)
    }
    else if (ts.isIfStatement(statement)) {
      visitExpression(statement.expression)
      {
        visit(statement.thenStatement)
      }
      if (statement.elseStatement != undefined) {
        visit(statement.elseStatement)
      }
    }
    else if (ts.isWhileStatement(statement)) {
      console.log('While statement is unimplemented')
    }
    else if (ts.isDoStatement(statement)) {
      console.log('Do-While statement is unimplemented')
    }
    else if (ts.isForStatement(statement)) {
      console.log('For statement is unimplemented')
    }
    else if (ts.isBlock(statement)) {
      scope.push()
      statement.statements.forEach(visitStatement)
      scope.pop()
    }
  }

  const visit = (node: ts.Node) => {
    if (ts.isSourceFile(node)
      && node.statements.length == 1
      && ts.isFunctionDeclaration(node.statements[0])) {
      if (node.statements[0].body == undefined) {
        throw Error(`Empty function body`)
      }

      visit(node.statements[0].body)
      return
    }

    if (ts.isBlock(node) || ts.isSourceFile(node)) {
      node.forEachChild(visitStatement)
      return
    }

    visitStatement(node)
  }

  visit(node)

  return ddg
}
