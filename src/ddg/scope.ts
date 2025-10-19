import { target, type Assignment } from './core'

export class Scope {
  stack: Map<string, Assignment>[]

  constructor() {
    this.stack = []
    this.push()
  }

  push() {
    this.stack.push(new Map<string, Assignment>())
  }

  pop() {
    this.stack.pop()
  }

  visit(assignment: Assignment) {
    const id = target(assignment)
    this.stack[this.stack.length - 1].set(id.text, assignment)
  }

  lookup(name: string): Assignment | undefined {
    for (let i = this.stack.length - 1; 0 <= i; i--) {
      const assignment = this.stack[i].get(name)
      if (assignment != undefined) {
        return assignment
      }
    }

    return undefined
  }
}
