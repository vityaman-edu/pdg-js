import { type Ddg } from './core'

export const printDdg = (ddg: Ddg): string => {
  let output = ''
  for (const [id, requirements] of ddg.dependencies) {
    const ctx = id.parent

    const file = id.getSourceFile()
    const expand = (pos: number) => file.getLineAndCharacterOfPosition(pos)

    const self = expand(id.pos)
    output += (
      `'${id.getText()}' in '${ctx.getText()}' at `
      + `:${(self.line + 1).toString()}\n`
    )

    for (const requirement of requirements) {
      const that = expand(requirement.pos)
      output += (
        `    '${requirement.getText()}' at `
        + `:${(that.line + 1).toString()} `
        + `\n`
      )
    }
  }
  return output
}
