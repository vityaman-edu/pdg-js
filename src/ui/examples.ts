export const examples: Record<string, string> = {
  'Hello World': `
console.log('Hello, World!')
console.log('Sorry, I have a boyfriend.')
`,
  'Fibonacci': `
let ans = 1
if (n < 0) {
  ans = "Input must be a non-negative integer.";
}
if (n === 0) {
    ans =  0;
}
if (n === 1) {
    ans =  1;
}

let a = 0; // F(0)
let b = 1; // F(1)

let i = 2
while (i <= n) {
  const temp = a + b;
  a = b;
  b = temp;
  i++
}

ans =  b;
`,
}
