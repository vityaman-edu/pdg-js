import ts from 'typescript'
import { isAssignmentExpression, type Ddg } from './core'
import { Scope } from './scope'
import { visitExpressionVariables, visitSimpleStatementVariables } from './visit'

export const buildDdg = (node: ts.SourceFile): Ddg => {
  const ddg: Ddg = { dependencies: new Map() }
  const scope = new Scope()

  const visitVariable = (node: ts.Identifier) => {
    const requirement = scope.lookup(node.text)
    if (requirement != undefined) {
      ddg.dependencies.set(node, requirement)
    }
  }

  const visitStatement = (statement: ts.Node) => {
    if (ts.isVariableStatement(statement)) {
      visitSimpleStatementVariables(statement, visitVariable)
      statement.declarationList.declarations.forEach((declaration) => {
        scope.visit(declaration)
      })
    }
    else if (ts.isExpressionStatement(statement)
      && isAssignmentExpression(statement.expression)) {
      visitSimpleStatementVariables(statement, visitVariable)
      scope.visit(statement.expression)
    }
    else if (ts.isIfStatement(statement)) {
      visitExpressionVariables(statement.expression, visitVariable)
      {
        visit(statement.thenStatement)
      }
      if (statement.elseStatement != undefined) {
        visit(statement.elseStatement)
      }
    }
    else if (ts.isWhileStatement(statement)) {
      console.error('While statement is unimplemented')
      visit(statement.statement)
    }
    else if (ts.isDoStatement(statement)) {
      console.error('Do-While statement is unimplemented')
      visit(statement.statement)
    }
    else if (ts.isForStatement(statement)) {
      console.error('For statement is unimplemented')
      visit(statement.statement)
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
