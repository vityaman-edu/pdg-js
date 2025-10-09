import * as ts from 'typescript'
import { type BasicBlock, type Branch, forEachBasicBlock, invalidBasicBlock, invalidTransition } from './core'

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

const validateNodes = (entry: BasicBlock) => {
  const invalid = invalidBasicBlock()
  forEachBasicBlock(entry, (block) => {
    if (block == invalid) {
      throw Error(`Found an invalid block`)
    }
  })
  return entry
}

const validate = (entry: BasicBlock) => {
  entry = validateNodes(entry)
  entry = validateParents(entry)
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

// TODO: BuildCfgOptions
export interface BuildCfgOptions {
  areEmptyJumpsEliminated: boolean
}

export const buildCfg = (node: ts.SourceFile, options?: BuildCfgOptions): BasicBlock => {
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

  const loopBreaks: BasicBlock[] = []
  const loopContinues: BasicBlock[] = []
  let current = entry

  const visitStatement = (statement: ts.Node) => {
    if (ts.isIfStatement(statement)) {
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
      loopBreaks.push(next)

      const cond = {
        ...newBasicBlock('whilecond'),
        end: {
          kind: 'branch',
          condition: statement.expression,
          then: invalidBasicBlock(),
          else: next,
        },
      }
      parent.end = { kind: 'jump', next: cond as BasicBlock }
      loopContinues.push(cond as BasicBlock)

      const body: BasicBlock = {
        ...newBasicBlock('whilebody'),
        end: { kind: 'jump', next: cond as BasicBlock },
      }
      cond.end.then = body

      {
        current = body
        visit(statement.statement)
      }

      loopBreaks.pop()
      loopContinues.pop()
      current = next
    }
    else if (ts.isDoStatement(statement)) {
      const parent = current

      const next = { ...newBasicBlock('next'), end: parent.end }
      loopBreaks.push(next)

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
      loopContinues.push(body)

      parent.end = { kind: 'jump', next: body }

      {
        current = body
        visit(statement.statement)
      }

      loopBreaks.pop()
      loopContinues.pop()
      current = next
    }
    else if (ts.isForStatement(statement)) {
      const parent = current

      const next = { ...newBasicBlock('next'), end: parent.end }
      loopBreaks.push(next)

      const initializer: BasicBlock = {
        ...newBasicBlock('forinit'),
        statements: (statement.initializer != null ? [statement.initializer] : []),
        end: invalidTransition(),
      }
      parent.end = { kind: 'jump', next: initializer }

      const condition: BasicBlock = {
        ...newBasicBlock('forcond'),
        end: {
          kind: 'branch',
          condition: statement.condition ?? ts.factory.createTrue(),
          then: invalidBasicBlock(),
          else: invalidBasicBlock(),
        },
      }
      initializer.end = { kind: 'jump', next: condition }

      const incrementor: BasicBlock = {
        ...newBasicBlock('forinc'),
        statements: statement.incrementor != null ? [statement.incrementor] : [],
        end: {
          kind: 'jump',
          next: condition,
        },
      }
      loopContinues.push(incrementor)

      const body: BasicBlock = {
        ...newBasicBlock('forbody'),
        end: invalidTransition(),
      }
      {
        const end = condition.end as Branch
        end.then = body
        end.else = next
      }
      {
        current = body
        visit(statement.statement)
      }
      current.end = { kind: 'jump', next: incrementor }

      loopBreaks.pop()
      loopContinues.pop()
      current = next
    }
    else if (ts.isBreakStatement(statement)) {
      if (loopBreaks.length == 0) {
        throw new Error('No enclosing loop')
      }

      const loopBreak = loopBreaks[loopBreaks.length - 1]
      const dead = { ...newBasicBlock('breakdead'), end: current.end }

      current.end = {
        kind: 'branch',
        condition: ts.factory.createTrue(),
        then: loopBreak,
        else: dead,
      }

      current = dead
    }
    else if (ts.isContinueStatement(statement)) {
      if (loopBreaks.length == 0) {
        throw new Error('No enclosing loop')
      }

      const loopContinue = loopContinues[loopContinues.length - 1]
      const dead = { ...newBasicBlock('continuedead'), end: current.end }

      current.end = {
        kind: 'branch',
        condition: ts.factory.createTrue(),
        then: loopContinue,
        else: dead,
      }

      current = dead
    }
    else if (statement.kind == ts.SyntaxKind.EndOfFileToken) {
      return
    }
    else {
      current.statements.push(statement)
    }
  }

  const visit = (node: ts.Node) => {
    if (ts.isBlock(node) || ts.isSourceFile(node)) {
      node.forEachChild(visitStatement)
      return
    }
    visitStatement(node)
  }

  visit(node)

  let result = entry
  result = setParents(result)
  result = validate(result)
  if (options?.areEmptyJumpsEliminated ?? false) {
    result = eliminateEmptyJumps(result)
    result = validate(result)
  }

  return result
}
