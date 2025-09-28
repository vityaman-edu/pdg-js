import {
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  type OnEdgesChange,
  type OnNodesChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useCallback } from 'react'

export interface GraphNode {
  id: string
  type: 'multiline'
  data: {
    text: string
  }
  position: {
    x: number
    y: number
  }
  width?: number | undefined
  height?: number | undefined
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  markerEnd: {
    type: MarkerType.ArrowClosed
    width: 20
    height: 20
    color: '#FF0072'
  }
}

export interface GraphState {
  nodes: GraphNode[]
  edges: GraphEdge[]
  setNodes: React.Dispatch<React.SetStateAction<GraphNode[]>>
  setEdges: React.Dispatch<React.SetStateAction<GraphEdge[]>>
  onNodesChange: OnNodesChange<GraphNode>
  onEdgesChange: OnEdgesChange<GraphEdge>
}

function MultilineNode({ data }: { data: { text: string } }) {
  return (
    <div style={{
      padding: 8,
      border: '1px solid #aaa',
      borderRadius: 4,
      whiteSpace: 'pre-line',
    }}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={true}
      />
      <div>
        {data.text}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={true}
      />
    </div>
  )
}

const LayoutFlow = ({ state }: { state: GraphState }) => {
  const nodeTypes = { multiline: MultilineNode }

  return (
    <div style={{ height: '100vh', width: '100vh' }}>
      <ReactFlow
        nodeTypes={nodeTypes}
        nodes={state.nodes}
        edges={state.edges}
        onNodesChange={state.onNodesChange}
        onEdgesChange={state.onEdgesChange}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  )
}

export const Graph = ({ state }: { state: GraphState }) => {
  return (
    <ReactFlowProvider>
      <LayoutFlow state={state} />
    </ReactFlowProvider>
  )
}
