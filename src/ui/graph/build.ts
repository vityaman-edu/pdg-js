import { type Edge, MarkerType, type Node } from '@xyflow/react'
import { forEachBasicBlock, type BasicBlock } from '../../cfg/core'
import { toStringExpr, toStringStatements } from '../../cfg/text'
import { isAssignmentExpression, type Assignment, type Ddg } from '../../ddg/core'
import { visitExpressionVariables, visitSimpleStatementVariables } from '../../ddg/visit'
import seedrandom from 'seedrandom'
import ts from 'typescript'

export const toGraph = (
  entry: BasicBlock,
  ddg: Ddg | undefined = undefined,
  theme: 'vs' | 'vs-dark' = 'vs',
) => {
  let id = 1
  const newId = () => {
    id += 1
    return id.toString()
  }

  const newNode = (block: BasicBlock) => {
    let end = ''
    switch (block.end.kind) {
      case 'return': {
        end = `return ${toStringExpr(block.end.expression)}`
      } break
      case 'branch': {
        end = `if (${toStringExpr(block.end.condition)})`
      } break
      case 'jump': {
        end = 'jump'
      } break
    }

    return {
      id: newId(),
      type: 'multiline' as const,
      data: {
        label: block.id,
        body: toStringStatements(block.statements),
        end: end,
        theme, // Pass theme to the node
      },
      position: { x: 0, y: 0 },
    }
  }

  const newEdge = (label: string, source: string, target: string) => {
    const randomHex = (rnd: seedrandom.PRNG) => {
      const [min, max] = [5, 10]
      return (Math.floor(rnd() * max) + min).toString(16)
    }

    const randomColor = () => {
      const rnd = seedrandom(`${source}-${target}`)

      let color = '#'
      for (let i = 0; i < 6; i++) {
        color += randomHex(rnd)
      }
      return color
    }

    // Theme-based colors
    const isDark = theme === 'vs-dark'
    const defaultColor = isDark ? '#a0a0a0' : '#6c757d'
    const thenColor = isDark ? '#4caf50' : '#28a745'
    const elseColor = isDark ? '#f44336' : '#dc3545'

    let color = defaultColor
    switch (label) {
      case 'then': {
        color = thenColor
      } break
      case 'else': {
        color = elseColor
      } break
      case 'depends': {
        color = randomColor()
      } break
    }

    let type = 'smart'
    let strokeWidth = 3
    let targetHandle = 'target'
    let sourceHandle = 'source'
    if (label == 'depends') {
      type = 'default'
      targetHandle += '2'
      sourceHandle += '2'
      strokeWidth = 1.5
    }

    return {
      id: newId(),
      type: type,
      source,
      target,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: color,
      },
      label: label,
      style: {
        strokeWidth: strokeWidth,
        stroke: color,
      },
      targetHandle: targetHandle,
      sourceHandle: sourceHandle,
    } as Edge
  }

  const nodes: Node[] = []
  const edges: Edge[] = []

  const idByBlock = new Map<BasicBlock, string>()
  forEachBasicBlock(entry, (block: BasicBlock) => {
    const node = newNode(block)
    nodes.push(node)
    idByBlock.set(block, node.id)
  })

  forEachBasicBlock(entry, (block: BasicBlock) => {
    const source = idByBlock.get(block) ?? ''
    const end = block.end
    switch (end.kind) {
      case 'jump': {
        const target = idByBlock.get(end.next) ?? ''
        edges.push(newEdge('jump', source, target))
      } break
      case 'branch': {
        const thenTarget = idByBlock.get(end.then) ?? ''
        const elseTarget = idByBlock.get(end.else) ?? ''
        edges.push(newEdge('then', source, thenTarget))
        edges.push(newEdge('else', source, elseTarget))
      } break
    }
  })

  const blockByAssignment = new Map<Assignment, BasicBlock>()
  forEachBasicBlock(entry, (block: BasicBlock) => {
    block.statements.forEach((statement) => {
      if (ts.isVariableDeclarationList(statement)) {
        statement.declarations.forEach((declaration) => {
          blockByAssignment.set(declaration, block)
        })
      }
      else if (ts.isVariableStatement(statement)) {
        statement.declarationList.declarations.forEach((declaration) => {
          blockByAssignment.set(declaration, block)
        })
      }
      else if (ts.isExpressionStatement(statement) && isAssignmentExpression(statement.expression)) {
        blockByAssignment.set(statement.expression, block)
      }
      else if (ts.isExpressionStatement(statement)
        && ts.isBinaryExpression(statement.expression)
        && (statement.expression.operatorToken.kind == ts.SyntaxKind.PlusEqualsToken
          || statement.expression.operatorToken.kind == ts.SyntaxKind.MinusEqualsToken)) {
        blockByAssignment.set(statement.expression, block)
      }
      else if (ts.isPostfixUnaryExpression(statement)) {
        blockByAssignment.set(statement, block)
      }
    })
  })

  if (ddg == undefined) {
    return { nodes, edges }
  }

  forEachBasicBlock(entry, (block: BasicBlock) => {
    const visit = (variable: ts.Identifier) => {
      ddg.dependencies.get(variable)?.forEach((assignment) => {
        const source = block
        const target = blockByAssignment.get(assignment)
        if (target == undefined) {
          return
        }

        const sourceId = idByBlock.get(source) ?? ''
        const targetId = idByBlock.get(target) ?? ''
        edges.push(newEdge('depends', sourceId, targetId))
      })
    }

    block.statements.forEach((statement) => {
      visitSimpleStatementVariables(statement, visit)
    })
    switch (block.end.kind) {
      case 'branch': {
        visitExpressionVariables(block.end.condition, visit)
      } break
      case 'return': {
        visitExpressionVariables(block.end.expression, visit)
      } break
    }
  })

  return { nodes, edges }
}
