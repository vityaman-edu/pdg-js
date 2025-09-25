import * as ts from 'typescript'

interface Halt {
  kind: 'halt'
}

interface Jump {
  kind: 'jump'
  next: BasicBlock
};

interface Branch {
  kind: 'branch'
  condition: ts.Expression
  then: BasicBlock
  else: BasicBlock
}

type Transition = Halt | Jump | Branch

interface BasicBlock {
  id: string
  parents: BasicBlock[]
  statements: ts.Node[]
  end: Transition
};

export const printBasicBlocks = (entry: BasicBlock) => {
  const visited: BasicBlock[] = []
  const queue = [entry]

  let output = ''

  for (;;) {
    const block = queue.shift()
    if (block == undefined) {
      break
    }
    if (visited.includes(block)) {
      continue
    }
    visited.push(block)

    output += `${block.id}:\n`
    for (const statement of block.statements) {
      output += '  '
      output += `${statement.getText()}\n`
    }

    output += '  '
    const end = block.end
    switch (end.kind) {
      case 'halt': {
        output += 'halt'
      } break
      case 'jump': {
        queue.push(end.next)
        output += `jump to ${end.next.id}`
      } break
      case 'branch': {
        queue.push(end.then, end.else)
        output += (
          `jump if (${end.condition.getText()})`
          + ` to ${end.then.id} else ${end.else.id}`
        )
      } break
    }
    output += '\n'
  }

  return output
}

export const basicBlocks = (node: ts.SourceFile) => {
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

  const visit = (statement: ts.Node) => {
    statement.forEachChild((statement) => {
      if (ts.isVariableStatement(statement)) {
        current.statements.push(statement)
      }
      else if (ts.isExpressionStatement(statement)) {
        current.statements.push(statement)
      }
      else if (ts.isIfStatement(statement)) {
        const parent = current
        const next = newBasicBlock('next')

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
        throw new Error('Not implemented')
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
      else {
        console.log(`(unknown) ${ts.SyntaxKind[statement.kind]}: ${statement.getText()}`)
      }
    })
  }

  visit(node)

  return printBasicBlocks(entry)
}
