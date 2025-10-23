import ts from 'typescript'
import { visitSimpleStatementVariables } from '../ddg/visit'

export class Scope {
  physycalByLogical: Map<string, string>[]
  countByName: Map<string, number>

  constructor() {
    this.physycalByLogical = []
    this.countByName = new Map<string, number>()
    this.push()
  }

  push() {
    this.physycalByLogical.push(new Map<string, string>())
  }

  pop() {
    this.physycalByLogical.pop()
  }

  visit(binding: ts.BindingName) {
    if (!ts.isIdentifier(binding)) {
      return
    }

    const name = binding.text

    const count = this.countByName.get(name) ?? 0
    this.countByName.set(name, count + 1)

    let physical = name
    if (count != 0) {
      physical += (count + 1).toString()
    }

    this._top().set(name, physical)
  }

  lookup(name: string): string | undefined {
    for (let i = this.physycalByLogical.length - 1; 0 <= i; i--) {
      const physical = this.physycalByLogical[i].get(name)
      if (physical != undefined) {
        return physical
      }
    }

    return undefined
  }

  _top(): Map<string, string> {
    return this.physycalByLogical[this.physycalByLogical.length - 1]
  }
}

export const physicalNames = (node: ts.SourceFile): Map<ts.Identifier, string> => {
  const names = new Map<ts.Identifier, string>()
  const scope = new Scope()

  const visit = (node: ts.Node) => {
    if (ts.isIdentifier(node)) {
      const physical = scope.lookup(node.text)
      if (physical == undefined) {
        return
      }

      names.set(node, physical)
    }
    else if (ts.isVariableDeclarationList(node)) {
      visitSimpleStatementVariables(node, visit)
      node.declarations.forEach((declaration) => {
        if (ts.isIdentifier(declaration.name)) {
          scope.visit(declaration.name)
          visit(declaration.name)
        }
      })
    }
    else if (ts.isVariableStatement(node)) {
      visitSimpleStatementVariables(node, visit)
      node.declarationList.declarations.forEach((declaration) => {
        if (ts.isIdentifier(declaration.name)) {
          scope.visit(declaration.name)
          visit(declaration.name)
        }
      })
    }
    else if (ts.isBlock(node)) {
      scope.push()
      node.statements.forEach(visit)
      scope.pop()
    }
    else {
      node.forEachChild(visit)
    }
  }

  const visitG = (node: ts.Node) => {
    if (ts.isSourceFile(node)
      && node.statements.length == 1
      && ts.isFunctionDeclaration(node.statements[0])) {
      if (node.statements[0].body == undefined) {
        throw Error(`Empty function body`)
      }

      visitG(node.statements[0].body)
      return
    }

    if (ts.isBlock(node) || ts.isSourceFile(node)) {
      node.forEachChild(visit)
      return
    }
  }

  visitG(node)
  return names
}
