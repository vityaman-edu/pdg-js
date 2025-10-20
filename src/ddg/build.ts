import ts from 'typescript'
import { isAssignmentExpression, type Ddg } from './core'
import { Scope } from './scope'

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

export const buildDdg = (node: ts.SourceFile): Ddg => {
  const ddg: Ddg = { dependencies: new Map() }
  const scope = new Scope()

  const visitExpression = (node: ts.Expression | undefined) => {
    if (node == undefined) {
      return
    }

    referencedVariables(node).forEach((node) => {
      const requirement = scope.lookup(node.text)
      if (requirement != undefined) {
        ddg.dependencies.set(node, requirement)
      }
    })
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
