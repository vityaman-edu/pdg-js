/* eslint-disable @typescript-eslint/no-non-null-assertion */

import ts from 'typescript'
import { forEachBasicBlock, type BasicBlock } from '../cfg/core'
import { isAssignmentExpression, target, type Assignment, type Ddg } from './core'
import { visitExpressionVariables, visitSimpleStatementVariables } from './visit'

function areSetEqual<V>(a: Set<V>, b: Set<V>): boolean {
  if (a.size !== b.size) {
    return false
  }

  for (const item of a) {
    if (!b.has(item)) {
      return false
    }
  }

  return true
}

function areMapEqual<K, V>(a: Map<K, Set<V>>, b: Map<K, Set<V>>): boolean {
  if (a.size !== b.size) {
    return false
  }

  for (const [ka, va] of a) {
    const vb = b.get(ka)
    if (vb == undefined || !areSetEqual(va, vb)) {
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
    console.debug(`visited variable ${variable.getText()} with id ${id}`)
    console.debug(assignments)
  }

  const visit = (block: BasicBlock) => {
    console.debug(`visit ${block.id}...`)

    if (visited.has(block) && areMapEqual(current, previous.get(block)!)) {
      console.debug(`no update for ${block.id}`)
      return
    }

    console.debug(`processing ${block.id}`)

    visited.add(block)

    mapReset(current, mapMerge(current, previous.get(block)!))
    previous.set(block, mapCopy(current))

    for (const statement of block.statements) {
      console.debug(`processing ${statement.getText()}`)

      visitSimpleStatementVariables(statement, visitVariable)

      if (ts.isVariableStatement(statement)) {
        statement.declarationList.declarations.forEach((declaration) => {
          const id = ids.get(target(declaration))
          if (id == undefined) {
            console.error(`not found rename for ${target(declaration).getText()}`)
            return
          }

          current.set(id, new Set([declaration]))
          console.debug(`redefine ${target(declaration).getText()} with id ${id}`)
          console.debug(declaration)
        })
      }
      else if (ts.isExpressionStatement(statement)
        && isAssignmentExpression(statement.expression)) {
        const expression = statement.expression

        const id = ids.get(target(expression))
        if (id == undefined) {
          console.error(`not found rename for ${target(expression).getText()}`)
          return
        }

        current.set(id, new Set([expression]))
        console.debug(`redefine ${target(expression).getText()} with id ${id}`)
        console.debug(expression)
      }
      else {
        console.debug(`is not redefinition statement`)
      }
    }

    switch (block.end.kind) {
      case 'branch': {
        visitExpressionVariables(block.end.condition, visitVariable)
        visit(block.end.then)
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
