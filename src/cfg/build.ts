import * as ts from 'typescript'
import { type BasicBlock, type Branch, forEachBasicBlock } from './core'

const setParents = (entry: BasicBlock) => {
  forEachBasicBlock(entry, (block) => {
    switch (block.end.kind) {
      case 'jump': {
        block.end.next.parents.add(block)
      } break
      case 'branch': {
        block.end.then.parents.add(block)
        block.end.else.parents.add(block)
      } break
    }
  })
  return entry
}

const validateParents = (entry: BasicBlock) => {
  forEachBasicBlock(entry, (block) => {
    switch (block.end.kind) {
      case 'jump': {
        if (!block.end.next.parents.has(block)) {
          throw Error(`Block ${block.end.next.id} (jump) missing parent ${block.id}`)
        }
      } break
      case 'branch': {
        if (!block.end.then.parents.has(block)) {
          throw Error(`Block ${block.end.then.id} (then) missing parent ${block.id}`)
        }
        if (!block.end.else.parents.has(block)) {
          throw Error(`Block ${block.end.else.id} (else) missing parent ${block.id}`)
        }
      } break
    }
  })
  return entry
}

const eliminateEmptyJumps = (entry: BasicBlock) => {
  forEachBasicBlock(entry, (block) => {
    if (block.statements.length != 0 || block.end.kind != 'jump') {
      return
    }
    const next = block.end.next

    block.parents.forEach((parent) => {
      next.parents.delete(block)
      next.parents.add(parent)
      switch (parent.end.kind) {
        case 'branch': {
          if (parent.end.then == block) {
            parent.end.then = next
          }
          if (parent.end.else == block) {
            parent.end.else = next
          }
        } break
        case 'jump': {
          parent.end.next = next
        } break
      }
    })
  })

  return entry
}

export const buildCfg = (node: ts.SourceFile): BasicBlock => {
  let id = 0

  const newName = (prefix: string) => {
    id += 1
    return `${prefix}${id.toString()}`
  }

  const newBasicBlock = (prefix: string) => {
    return {
      id: newName(prefix),
      parents: new Set(),
      statements: [],
      end: { kind: 'return' },
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
          parents: new Set(),
          statements: [],
          end: { kind: 'jump', next },
        }

        const elseBlock: BasicBlock = {
          id: newName('else'),
          parents: new Set(),
          statements: [],
          end: { kind: 'jump', next },
        }

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

        const cond = {
          ...newBasicBlock('while'),
          end: {
            kind: 'branch',
            condition: statement.expression,
            then: next,
            else: next,
          },
        }
        parent.end = { kind: 'jump', next: cond as BasicBlock }

        const body: BasicBlock = {
          ...newBasicBlock('loop'),
          end: { kind: 'jump', next: cond as BasicBlock },
        }
        cond.end.then = body

        {
          current = body
          visit(statement.statement)
        }

        current = next
      }
      else if (ts.isDoStatement(statement)) {
        const parent = current
        const next = { ...newBasicBlock('next'), end: parent.end }

        const body: BasicBlock = {
          id: newName('dowhile'),
          parents: new Set([]),
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

        parent.end = { kind: 'jump', next: body }

        {
          current = body
          visit(statement.statement)
        }

        current = next
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

  let result = entry
  result = setParents(result)
  result = validateParents(result)
  result = eliminateEmptyJumps(result)
  result = validateParents(result)

  return result
}
