export const examples: Record<string, string> = {
  'Hello World': `
console.log('Hello, World!')
console.log('Sorry, I have a boyfriend.')
`,
  'Fibonacci': `
if (n < 0) {
  throw new Error("Input must be a non-negative integer.");
}
if (n === 0) return 0;
if (n === 1) return 1;

let a = 0; // F(0)
let b = 1; // F(1)

for (let i = 2; i <= n; i++) {
  const temp = a + b;
  a = b;
  b = temp;
}

return b;
`,
}
