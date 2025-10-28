import { forEachBasicBlock, invalidTransition, type BasicBlock } from './core'
import { MultiSet } from 'mnemonist'

export const split = (entry: BasicBlock): BasicBlock => {
  forEachBasicBlock(entry, (block) => {
    if (block.statements.length < 1) {
      return
    }

    const end = block.end

    const blocks: BasicBlock[] = [block]
    for (let i = 1; i < block.statements.length + 1; ++i) {
      const newbie: BasicBlock = {
        id: `${block.id}${i.toString()}`,
        parents: new MultiSet(),
        statements: (i < block.statements.length) ? [block.statements[i]] : [],
        end: invalidTransition(),
      }
      newbie.parents.add(blocks[i - 1])
      blocks.push(newbie)
    }
    block.statements = [block.statements[0]]

    for (let i = 0; i < blocks.length - 1; ++i) {
      blocks[i].end = {
        kind: 'jump',
        next: blocks[i + 1],
      }
    }

    const last = blocks[blocks.length - 1]
    last.end = end

    switch (end.kind) {
      case 'jump': {
        end.next.parents.remove(block)
        end.next.parents.add(last)
      } break
      case 'branch': {
        end.then.parents.remove(block)
        end.then.parents.add(last)
        end.else.parents.remove(block)
        end.else.parents.add(last)
      } break
    }
  })

  return entry
}
