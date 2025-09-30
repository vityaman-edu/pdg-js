import * as ts from 'typescript'
import { type BasicBlock, forEachBasicBlock } from './core'

export const toStringStatements = (statements: ts.Node[]) => {
  let output = ''
  for (const statement of statements) {
    output += '  '
    output += `${statement.getText()}\n`
  }
  return output
}

export const toStringBB = (block: BasicBlock) => {
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

export const printCfg = (entry: BasicBlock) => {
  let output = ''
  forEachBasicBlock(entry, (block: BasicBlock) => {
    output += toStringBB(block)
  })
  return output
}
