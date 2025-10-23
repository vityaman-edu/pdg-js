import { type Edge, MarkerType, type Node } from '@xyflow/react'
import { forEachBasicBlock, type BasicBlock } from '../../cfg/core'
import { toStringExpr, toStringStatements } from '../../cfg/text'
import { isAssignmentExpression, type Assignment, type Ddg } from '../../ddg/core'
import { visitSimpleStatementVariables } from '../../ddg/visit'
import ts from 'typescript'

export const toGraph = (
  entry: BasicBlock,
  ddg: Ddg | undefined = undefined,
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
      },
      position: { x: 0, y: 0 },
    }
  }

  const newEdge = (label: string, source: string, target: string) => {
    const randomHex = () => {
      const [min, max] = [3, 11]
      return (Math.floor(Math.random() * max) + min).toString(16)
    }

    const randomColor = () => {
      let color = '#'
      for (let i = 0; i < 6; i++) {
        color += randomHex()
      }
      return color
    }

    let color = '#6c757d'
    switch (label) {
      case 'then': {
        color = '#28a745'
      } break
      case 'else': {
        color = '#dc3545'
      } break
      case 'depends': {
        color = randomColor()
      } break
    }

    let type = 'smart'
    let strokeWidth = 4
    let animated = true
    let targetHandle = 'target'
    let sourceHandle = 'source'
    if (label == 'depends') {
      type = 'default'
      targetHandle += '2'
      sourceHandle += '2'
      animated = false
      strokeWidth = 2
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
      animated: animated,
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
      if (ts.isVariableStatement(statement)) {
        statement.declarationList.declarations.forEach((declaration) => {
          blockByAssignment.set(declaration, block)
        })
      }
      else if (ts.isExpressionStatement(statement) && isAssignmentExpression(statement.expression)) {
        blockByAssignment.set(statement.expression, block)
      }
    })
  })

  if (ddg == undefined) {
    return { nodes, edges }
  }

  forEachBasicBlock(entry, (block: BasicBlock) => {
    block.statements.forEach((statement) => {
      visitSimpleStatementVariables(statement, (variable) => {
        const assignment = ddg.dependencies.get(variable)
        if (assignment == undefined) {
          return
        }

        const source = block
        const target = blockByAssignment.get(assignment)
        if (target == undefined) {
          return
        }

        const sourceId = idByBlock.get(source) ?? ''
        const targetId = idByBlock.get(target) ?? ''
        edges.push(newEdge('depends', sourceId, targetId))
      })
    })
  })

  return { nodes, edges }
}
