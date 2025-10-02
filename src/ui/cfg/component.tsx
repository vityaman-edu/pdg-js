import { Handle, Position } from '@xyflow/react'

interface NodeData {
  label: string
  body: string
  end: string
}

const getEndBackgroundColor = (data: NodeData) => {
  if (data.end.startsWith('halt')) {
    return '#dc3545'
  }
  else if (data.end.startsWith('if')) {
    return '#007bff'
  }
  else if (data.end.startsWith('jump')) {
    return '#28a745'
  }
  return '#6c757d'
}

const getEndTextColor = (data: NodeData) => {
  if (data.end.startsWith('halt') || data.end.startsWith('if')) {
    return 'white'
  }
  return 'white'
}

export const MultilineNode = ({ data }: { data: NodeData }) => {
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
          padding: '4px 4px',
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
            padding: '4px',
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
            backgroundColor: getEndBackgroundColor(data),
            color: getEndTextColor(data),
            padding: '4px 4px',
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
