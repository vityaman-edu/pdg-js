import { Handle, Position } from '@xyflow/react'

interface NodeData {
  label: string
  body: string
  end: string
  theme?: 'vs' | 'vs-dark'
}

const getEndBackgroundColor = (data: NodeData) => {
  if (data.end.startsWith('return')) {
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
  if (data.end.startsWith('return') || data.end.startsWith('if')) {
    return 'white'
  }
  return 'white'
}

export const MultilineNode = ({ data }: { data: NodeData }) => {
  const isLabelShown = false

  // Theme-based styles
  const isDark = data.theme === 'vs-dark'
  const nodeBackgroundColor = isDark ? '#2d2d2d' : '#f5f5f5'
  const nodeBorderColor = isDark ? '#555' : '#333'
  const labelBackgroundColor = isDark ? '#444' : '#333'
  const handleBackgroundColor = isDark ? '#666' : '#555'
  const endBorderColor = isDark ? '#555' : '#333'
  const boxShadow = isDark ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.1)'

  return (
    <div style={{
      border: `2px solid ${nodeBorderColor}`,
      borderRadius: 8,
      backgroundColor: nodeBackgroundColor,
      minWidth: 200,
      maxWidth: 300,
      overflow: 'hidden',
      boxShadow,
    }}
    >
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
      }}
      >
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={true}
          style={{ background: handleBackgroundColor, left: '25%' }}
          id="target"
        />
        <Handle
          type="source"
          position={Position.Top}
          isConnectable={true}
          style={{ background: handleBackgroundColor, left: '75%' }}
          id="source2"
        />
      </div>

      {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        isLabelShown && (
          <div
            style={{
              backgroundColor: labelBackgroundColor,
              color: 'white',
              padding: '4px 4px',
              fontWeight: 'bold',
              fontSize: 14,
              textAlign: 'center',
            }}
          >
            {data.label}
          </div>
        )
      }
      {data.body && (
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
      {data.end && data.end != 'jump' && (
        <div
          style={{
            backgroundColor: getEndBackgroundColor(data),
            color: getEndTextColor(data),
            padding: '4px 4px',
            fontWeight: 'bold',
            fontSize: 14,
            borderTop: `1px solid ${endBorderColor}`,
            textAlign: 'center',
          }}
        >
          {data.end}
        </div>
      )}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
      }}
      >
        <Handle
          type="source"
          position={Position.Bottom}
          isConnectable={true}
          style={{ background: handleBackgroundColor, left: '25%' }}
          id="source"
        />
        <Handle
          type="target"
          position={Position.Bottom}
          isConnectable={true}
          style={{ background: handleBackgroundColor, left: '75%' }}
          id="target2"
        />
      </div>
    </div>
  )
}
