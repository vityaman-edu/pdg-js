import * as ts from 'typescript'

export interface Return {
  kind: 'return'
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

export type Transition = Return | Jump | Branch

export interface BasicBlock {
  id: string
  parents: Set<BasicBlock>
  statements: ts.Node[]
  end: Transition
}

export const forEachBasicBlock = (
  entry: BasicBlock,
  visit: (block: BasicBlock) => void,
) => {
  const visited: BasicBlock[] = []
  const queue = [entry]

  for (; ;) {
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

export const invalidBasicBlock = () => {
  return {
    id: 'invalid',
    parents: new Set(),
    statements: [],
    end: { kind: 'return' },
  } as BasicBlock
}

export const invalidTransition = () => {
  return { kind: 'jump', next: invalidBasicBlock() } as Transition
}
