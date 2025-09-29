import * as ts from 'typescript'

export interface Halt {
  kind: 'halt'
}

export interface Jump {
  kind: 'jump'
  next: BasicBlock
};

export interface Branch {
  kind: 'branch'
  condition: ts.Expression
  then: BasicBlock
  else: BasicBlock
}

export type Transition = Halt | Jump | Branch

export interface BasicBlock {
  id: string
  parents: BasicBlock[]
  statements: ts.Node[]
  end: Transition
};

export const forEachBasicBlock = (
  entry: BasicBlock,
  visit: (block: BasicBlock) => void,
) => {
  const visited: BasicBlock[] = []
  const queue = [entry]

  for (;;) {
    const block = queue.shift()
    if (block == undefined) {
      break
    }
    if (visited.includes(block)) {
      continue
    }
    visited.push(block)

    visit(block)

    const end = block.end
    switch (end.kind) {
      case 'jump': {
        queue.push(end.next)
      } break
      case 'branch': {
        queue.push(end.then, end.else)
      } break
    }
  }
}

export const toStringStatements = (statements: ts.Node[]) => {
  let output = ''
  for (const statement of statements) {
    output += '  '
    output += `${statement.getText()}\n`
  }
  return output
}

export const toString = (block: BasicBlock) => {
  let output = ''

  output += `${block.id}:\n`
  output += toStringStatements(block.statements)

  output += '  '
  const end = block.end
  switch (end.kind) {
    case 'halt': {
      output += 'halt'
    } break
    case 'jump': {
      output += `jump to ${end.next.id}`
    } break
    case 'branch': {
      output += (
        `jump if (${end.condition.getText()})`
        + ` to ${end.then.id} else ${end.else.id}`
      )
    } break
  }
  output += '\n'

  return output
}

export const printBasicBlocks = (entry: BasicBlock) => {
  let output = ''
  forEachBasicBlock(entry, (block: BasicBlock) => {
    output += toString(block)
  })
  return output
}

export const basicBlocks = (node: ts.SourceFile): BasicBlock => {
  let id = 0

  const newName = (prefix: string) => {
    id += 1
    return `${prefix}${id.toString()}`
  }

  const newBasicBlock = (prefix: string) => {
    return {
      id: newName(prefix),
      parents: [],
      statements: [],
      end: { kind: 'halt' },
    } as BasicBlock
  }

  const entry = newBasicBlock('start')

  let current = entry

  const visit = (node: ts.Node) => {
    node.forEachChild((statement) => {
      if (ts.isVariableStatement(statement)) {
        current.statements.push(statement)
      }
      else if (ts.isExpressionStatement(statement)) {
        current.statements.push(statement)
      }
      else if (ts.isIfStatement(statement)) {
        const parent = current
        const next = { ...newBasicBlock('next'), end: parent.end }

        const thenBlock: BasicBlock = {
          id: newName('then'),
          parents: [parent],
          statements: [],
          end: { kind: 'jump', next },
        }

        const elseBlock: BasicBlock = {
          id: newName('else'),
          parents: [parent],
          statements: [],
          end: { kind: 'jump', next },
        }

        next.parents.push(thenBlock, elseBlock)
        parent.end = {
          kind: `branch`,
          condition: statement.expression,
          then: thenBlock,
          else: elseBlock,
        }

        {
          current = thenBlock
          visit(statement.thenStatement)
        }

        if (statement.elseStatement != null) {
          current = elseBlock
          visit(statement.elseStatement)
        }

        current = next
      }
      else if (ts.isWhileStatement(statement)) {
        const parent = current
        const next = { ...newBasicBlock('next'), end: parent.end }

        const body: BasicBlock = {
          id: newName('while'),
          parents: [parent],
          statements: [],
          end: {
            kind: 'branch',
            condition: statement.expression,
            then: next,
            else: next,
          },
        }
        {
          const end = body.end as Branch
          end.then = body
        }

        next.parents.push(body, parent)
        parent.end = {
          kind: 'branch',
          condition: statement.expression,
          then: body,
          else: next,
        }

        {
          current = body
          visit(statement.statement)
        }

        current = next
      }
      else if (ts.isDoStatement(statement)) {
        throw new Error('Not implemented')
      }
      else if (ts.isForStatement(statement)) {
        throw new Error('Not implemented')
      }
      else if (ts.isForInStatement(statement)) {
        throw new Error('Not implemented')
      }
    })
  }

  visit(node)

  return entry
}
