/* eslint-disable @typescript-eslint/no-non-null-assertion */

import ts from 'typescript'
import { forEachBasicBlock, type BasicBlock } from '../cfg/core'
import { isAssignmentExpression, target, type Assignment, type Ddg } from './core'
import { visitExpressionVariables, visitSimpleStatementVariables } from './visit'

function isSetSubsetOf<V>(b: Set<V>, a: Set<V>): boolean {
  for (const item of a) {
    if (!b.has(item)) {
      return false
    }
  }

  return true
}

function isMapSubsetOf<K, V>(b: Map<K, Set<V>>, a: Map<K, Set<V>>): boolean {
  for (const [ka, va] of a) {
    const vb = b.get(ka)
    if (vb == undefined || !isSetSubsetOf(vb, va)) {
      return false
    }
  }

  return true
}

function mapCopy<K, V>(a: Map<K, Set<V>>) {
  const b = new Map<K, Set<V>>()
  for (const [k, v] of a) {
    b.set(k, new Set(v))
  }
  return b
}

function mapMerge<K, V>(a: Map<K, Set<V>>, b: Map<K, Set<V>>): Map<K, Set<V>> {
  const merged = mapCopy(a)
  for (const [kb, vb] of b) {
    const va = merged.get(kb) ?? new Set<V>()
    merged.set(kb, new Set([...va, ...vb]))
  }
  return merged
}

function mapReset<K, V>(a: Map<K, Set<V>>, b: Map<K, Set<V>>) {
  a.clear()
  for (const [k, v] of b) {
    a.set(k, new Set(v))
  }
}

export const buildDdg = (cfg: BasicBlock, ids: Map<ts.Identifier, string>): Ddg => {
  const ddg: Ddg = { dependencies: new Map<ts.Identifier, Set<Assignment>>() }

  const visited = new Set<BasicBlock>()

  const previous = new Map<BasicBlock, Map<string, Set<Assignment>>>()
  forEachBasicBlock(cfg, (block) => {
    previous.set(block, new Map<string, Set<Assignment>>())
  })

  const current = new Map<string, Set<Assignment>>()

  const visitVariable = (variable: ts.Identifier) => {
    const id = ids.get(variable) ?? '?'
    const assignments = new Set(current.get(id) ?? new Set<Assignment>())
    ddg.dependencies.set(variable, assignments)
  }

  const limit = 1000
  let iteration = 0

  const visit = (block: BasicBlock) => {
    iteration += 1
    if (limit <= iteration) {
      console.error('DDG depth limit exceeded')
      return
    }

    if (visited.has(block) && isMapSubsetOf(previous.get(block)!, current)) {
      return
    }

    visited.add(block)

    mapReset(current, mapMerge(current, previous.get(block)!))
    previous.set(block, mapCopy(current))

    for (const statement of block.statements) {
      visitSimpleStatementVariables(statement, visitVariable)

      if (ts.isVariableDeclarationList(statement)) {
        statement.declarations.forEach((declaration) => {
          const id = ids.get(target(declaration)) ?? '?'
          current.set(id, new Set([declaration]))
        })
      }
      else if (ts.isVariableStatement(statement)) {
        statement.declarationList.declarations.forEach((declaration) => {
          const id = ids.get(target(declaration)) ?? ''
          current.set(id, new Set([declaration]))
        })
      }
      else if (ts.isExpressionStatement(statement)
        && isAssignmentExpression(statement.expression)) {
        const expression = statement.expression
        const id = ids.get(target(expression)) ?? ''
        current.set(id, new Set([expression]))
      }
      else if (ts.isExpressionStatement(statement)
        && ts.isBinaryExpression(statement.expression)
        && ts.isIdentifier(statement.expression.left)
        && (statement.expression.operatorToken.kind == ts.SyntaxKind.PlusEqualsToken
          || statement.expression.operatorToken.kind == ts.SyntaxKind.MinusEqualsToken)) {
        const id = ids.get(statement.expression.left) ?? ''
        current.set(id, new Set([statement.expression]))
      }
      else if (ts.isPostfixUnaryExpression(statement)
        && ts.isIdentifier(statement.operand)) {
        const operand = statement.operand
        const id = ids.get(operand) ?? ''
        current.set(id, new Set([statement]))
      }
    }

    switch (block.end.kind) {
      case 'branch': {
        visitExpressionVariables(block.end.condition, visitVariable)

        const backup = mapCopy(current)
        visit(block.end.then)

        mapReset(current, backup)
        visit(block.end.else)
      } break
      case 'jump': {
        visit(block.end.next)
      } break
      case 'return': {
        visitExpressionVariables(block.end.expression, visitVariable)
      } break
    }
  }

  visit(cfg)
  return ddg
}
