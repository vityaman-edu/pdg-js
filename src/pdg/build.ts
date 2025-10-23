import ts from 'typescript'
import { forEachBasicBlock, type BasicBlock } from '../cfg/core'
import { isAssignmentExpression, type Ddg } from '../ddg/core'
import type { Pdg } from './core'
import { referencedVariables } from '../ddg/visit'

export const buildDdg = (cfg: BasicBlock, ddg: Ddg): Pdg => {
  const pdg: Pdg = { dependenciesByBasicBlock: new Map() }
  forEachBasicBlock(cfg, (block) => {
    pdg.dependenciesByBasicBlock.set(block.id, new Set())
  })

  const blockByNode = new Map<ts.Node, string>()
  forEachBasicBlock(cfg, (block) => {
    block.statements.forEach((statement) => {
      if (ts.isVariableStatement(statement)) {
        statement.declarationList.declarations.forEach((declaration) => {
          blockByNode.set(declaration, block.id)
        })
      }
      else if (ts.isExpressionStatement(statement)
        && isAssignmentExpression(statement.expression)) {
        blockByNode.set(statement.expression, block.id)
      }
    })
  })

  const visitExpression = (block: BasicBlock, expression: ts.Expression) => {
    referencedVariables(expression).forEach((variable) => {
      const dependency = ddg.dependencies.get(variable)
      if (dependency == undefined) {
        throw Error(`Dependency not found for ${variable.getText()}`)
      }

      const requirement = blockByNode.get(dependency)
      if (requirement == undefined) {
        throw Error(`Block not found for ${variable.getText()}`)
      }

      pdg.dependenciesByBasicBlock.get(block.id)?.add(requirement)
    })
  }

  forEachBasicBlock(cfg, (block) => {
    block.statements.forEach((statement) => {
      if (ts.isVariableStatement(statement)) {
        statement.declarationList.declarations.forEach((declaration) => {
          if (declaration.initializer == undefined) {
            return
          }

          visitExpression(block, declaration.initializer)
        })
      }
      else if (ts.isExpressionStatement(statement)
        && isAssignmentExpression(statement.expression)) {
        visitExpression(block, statement.expression.right)
      }
    })
  })

  const keys = [...pdg.dependenciesByBasicBlock.keys()]
  keys.forEach((key) => {
    pdg.dependenciesByBasicBlock.get(key)?.delete(key)
  })

  return pdg
}
