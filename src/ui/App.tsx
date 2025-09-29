import { Background, type Edge, Handle, MarkerType, type Node, Position, ReactFlow, ReactFlowProvider, useEdgesState, useNodesInitialized, useNodesState } from '@xyflow/react'
import { Editor } from '@monaco-editor/react'
import { SmartBezierEdge } from '@tisoap/react-flow-smart-edge'
import { useEffect, useState } from 'react'
import '@xyflow/react/dist/style.css'
import './App.css'
import { forEachBasicBlock, type BasicBlock, toStringStatements } from '../pdg/cfg'
import { play } from '../pdg/playground'
import { layout } from './Layout'

interface NodeData {
  label: string
  body: string
  end: string
}

const MultilineNode = ({ data }: { data: NodeData }) => {
  // Determine the background color based on the end statement type
  const getEndBackgroundColor = () => {
    if (data.end.startsWith('halt')) {
      return '#dc3545' // Red for halt
    }
    else if (data.end.startsWith('if')) {
      return '#007bff' // Blue for if statements
    }
    else if (data.end.startsWith('jump')) {
      return '#28a745' // Green for jump
    }
    return '#6c757d' // Default gray for other cases
  }

  // Determine the text color based on the background for better contrast
  const getEndTextColor = () => {
    if (data.end.startsWith('halt') || data.end.startsWith('if')) {
      return 'white'
    }
    return 'white'
  }

  return (
    <div style={{
      border: '2px solid #333',
      borderRadius: 8,
      backgroundColor: '#f5f5f5',
      minWidth: 200,
      maxWidth: 300,
      overflow: 'hidden',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    }}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={true}
        style={{ background: '#555' }}
      />
      <div
        style={{
          backgroundColor: '#333',
          color: 'white',
          padding: '8px 12px',
          fontWeight: 'bold',
          fontSize: 14,
          textAlign: 'center',
        }}
      >
        {data.label}
      </div>
      { data.body && (
        <div
          style={{
            padding: '12px',
            fontSize: 13,
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.4,
          }}
        >
          {data.body}
        </div>
      )}
      {data.end && (
        <div
          style={{
            backgroundColor: getEndBackgroundColor(),
            color: getEndTextColor(),
            padding: '8px 12px',
            fontWeight: 'bold',
            fontSize: 14,
            borderTop: '1px solid #333',
            textAlign: 'center',
          }}
        >
          {data.end}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={true}
        style={{ background: '#555' }}
      />
    </div>
  )
}

const toGraph = (source: string) => {
  const entry = play(source)

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

const nodeTypes = {
  multiline: MultilineNode,
}

const edgeTypes = {
  smart: SmartBezierEdge,
}

export const App = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  const onSourceChange = (source: string) => {
    const { nodes, edges } = toGraph(source)
    setNodes(nodes)
    setEdges(edges)
  }

  const LayoutFlow = () => {
    const useLayout = () => {
      const areNodesReady = useNodesInitialized({})
      const [layouted, setLayouted] = useState(nodes)

      useEffect(() => {
        if (areNodesReady) {
          setLayouted(layout(nodes, edges))
        }
      }, [areNodesReady])

      return layouted
    }

    const layouted = useLayout()

    return (
      <div style={{ height: '100%', width: '100%' }}>
        <ReactFlow
          nodes={layouted}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
        >
          <Background />
        </ReactFlow>
      </div>
    )
  }

  return (
    <div className="app-container">
      <div className="editor-container" style={{ height: '80vh', width: '80vh' }}>
        <h2>Editor</h2>
        <Editor
          defaultLanguage="typescript"
          defaultValue="// some comment"
          onChange={(value) => { onSourceChange(value ?? '') }}
          options={{
            fontSize: 22,
            minimap: { enabled: false },
          }}
        />
      </div>
      <div className="content-container" style={{ height: '86vh', width: '90vh' }}>
        <h2>Basic Blocks</h2>
        <ReactFlowProvider>
          <LayoutFlow />
        </ReactFlowProvider>
      </div>
    </div>
  )
}

export default App
