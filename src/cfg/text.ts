import * as ts from 'typescript'
import { type BasicBlock, forEachBasicBlock } from './core'

export const toStringStatements = (statements: ts.Node[]) => {
  let output = ''
  for (const statement of statements) {
    output += `${statement.getText()}\n`
  }
  return output
}

export const toStringBB = (block: BasicBlock) => {
  let output = ''

  output += `/* ${block.id}: */ \n`
  output += toStringStatements(block.statements)

  const end = block.end
  switch (end.kind) {
    case 'return': {
      output += 'return'
    } break
    case 'jump': {
      output += `jump('${end.next.id}')`
    } break
    case 'branch': {
      output += (
        `if (${end.condition.getText()})`
        + ` jump('${end.then.id}') else jump('${end.else.id}')`
      )
    } break
  }
  output += '\n'

  return output
}

export const printCfg = (entry: BasicBlock) => {
  let output = ''
  output += '{\n'
  output += `const jump = (label: string) => { }\n`
  output += '\n'
  forEachBasicBlock(entry, (block: BasicBlock) => {
    output += toStringBB(block)
  })
  output += '}\n'
  return output
}
