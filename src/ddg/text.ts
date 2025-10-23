import { type Ddg } from './core'

export const printDdg = (ddg: Ddg): string => {
  let output = ''
  for (const [id, requirements] of ddg.dependencies) {
    for (const requirement of requirements) {
      const file = id.getSourceFile()
      const expand = (pos: number) => file.getLineAndCharacterOfPosition(pos)

      const self = expand(id.pos)
      const that = expand(requirement.pos)

      output += (
        `${id.getText()} at `
        + `:${(self.line + 1).toString()} `
        + `depends on assignment at `
        + `:${(that.line + 1).toString()} `
        + `(${requirement.getText()})`
        + `\n`
      )
    }
  }
  return output
}
