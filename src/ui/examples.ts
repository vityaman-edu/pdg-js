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

console.log('if {}')
if (x % 2 == 0) {
  console.log(\`\${x} is even\`)
}

console.log('if {} else {}')
if (x % 2 == 0) {
  console.log(\`\${x} is even\`)
} else {
  console.log(\`\${x} is odd\`)
}

console.log('if {} else if {}')
if (x % 3 == 0) {
  console.log(0)
} else if (x % 3 == 1) {
  console.log(1)
} else if (x % 3 == 2) {
  console.log(2)
}

console.log('if {} else if {} else {}')
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

  'Loop': `
let x = 1

console.log('while {}')
while (x < 10) {
  x += 1
}

console.log('do {} while')
do {
  x -= 1
} while (x > 0)

console.log('for 0 0 0')
for (/*     */; /*  */; /* */) {
  console.log('Yes')
}

console.log('for 1 0 0')
for (let i = 0; /*  */; /* */) {
  console.log(\`i = \${i}\`)
}

console.log('for 0 1 0')
for (/*     */; x < 10; /* */) {
  console.log(\`x = \${x}\`)
}

console.log('for 1 1 0')
for (let i = 0; i < 10; /* */) {
  console.log(\`x = \${x}\`)
}

console.log('for 0 0 1')
for (/*     */; /*  */; x++) {
  console.log(\`x = \${x}\`)
}

console.log('for 1 0 1')
for (let i = 0; /*  */; i++) {
  console.log(\`i = \${i}\`)
}

console.log('for 0 1 1')
for (/*     */; x < 10; x++) {
  console.log(\`x = \${x}\`)
}

console.log('for 1 1 1')
for (let i = 0; i < 10; i++) {
  console.log(\`i = \${i}\`)
}
`,

  'Break / Continue': `
console.log('break')
while (true) {
  console.log('begin')
  break
  console.log('end')
}

console.log('continue')
while (true) {
  console.log('begin')
  continue
  console.log('end')
}
`,
}
