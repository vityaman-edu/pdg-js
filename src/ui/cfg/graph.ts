import { type Edge, MarkerType, type Node } from '@xyflow/react'
import { forEachBasicBlock, type BasicBlock } from '../../cfg/core'
import { toStringStatements } from '../../cfg/text'

export const toGraph = (entry: BasicBlock) => {
  let id = 1
  const newId = () => {
    id += 1
    return id.toString()
  }

  const newNode = (block: BasicBlock) => {
    let end = ''
    switch (block.end.kind) {
      case 'halt': {
        end = 'halt'
      } break
      case 'branch': {
        end = `if (${block.end.condition.getText()})`
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
    let color = '#6c757d'
    switch (label) {
      case 'then': {
        color = '#28a745'
      } break
      case 'else': {
        color = '#dc3545'
      } break
    }

    return {
      id: newId(),
      type: 'smart',
      source,
      target,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: color,
      },
      label: label,
      style: {
        strokeWidth: 3,
        stroke: color,
      },
    }
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

  return { nodes, edges }
}
