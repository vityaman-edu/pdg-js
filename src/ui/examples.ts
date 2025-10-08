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

  'If Statement': `
let x = 2

if (x % 2 == 0) {
  console.log(\`\${x} is even\`)
}

if (x % 2 == 0) {
  console.log(\`\${x} is even\`)
} else {
  console.log(\`\${x} is odd\`)
}

if (x % 3 == 0) {
  console.log(0)
} else if (x % 3 == 1) {
  console.log(1)
} else if (x % 3 == 2) {
  console.log(2)
}

if (x % 4 == 1) {
  console.log(1)
} else if (x % 4 == 2) {
  console.log(2)
} else if (x % 4 == 3) {
  console.log(3)
} else {
  console.log(0)
}
`,

}
