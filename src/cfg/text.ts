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

  output += `/* ${block.id}: */ \n`
  output += toStringStatements(block.statements)

  output += '  '
  const end = block.end
  switch (end.kind) {
    case 'halt': {
      output += 'jump(\'halt\')'
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
  output += `const jump = (label: string) => { }\n`
  output += '\n'
  forEachBasicBlock(entry, (block: BasicBlock) => {
    output += toStringBB(block)
  })
  return output
}
