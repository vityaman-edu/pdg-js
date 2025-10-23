export const examples: Record<string, string> = {
  'Hello World': `
console.log('Hello, World!')
console.log('Sorry, I have a boyfriend.')
`,

  'Linear': `
let a = 1
let b = a
let c = a + b
a = c + b
`,

  'Fibonacci': `
function fibonacciIterative(n: number): number {
  if (n < 0) {
    throw new Error();
  }

  if (n <= 1) {
    return n;
  }

  let a = 0;
  let b = 1;

  for (let i = 2; i <= n; i++) {
    const temp = a + b;
    a = b;
    b = temp;
  }

  return b;
}
`,

  'If Statement (if {})': `
let x = 2
if (x % 2 == 0) {
  console.log(\`\${x} is even\`)
}
`,

  'If Statement (if {} else {})': `
let x = 2
if (x % 2 == 0) {
  console.log(\`\${x} is even\`)
} else {
  console.log(\`\${x} is odd\`)
}
`,

  'If Statement (if {} else if {})': `
let x = 2
if (x % 3 == 0) {
  console.log(0)
} else if (x % 3 == 1) {
  console.log(1)
} else if (x % 3 == 2) {
  console.log(2)
}
`,

  'If Statement (if {} else if {} else {})': `
let x = 2
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

  'While': `
let x = 1
while (x < 10) {
  x += 1
}
`,

  'While Direct Break': `
while (true) {
  console.log('begin')
  break
  console.log('end')
}
`,

  'While Direct Continue': `
while (true) {
  console.log('begin')
  continue
  console.log('end')
}
`,

  'While If Break': `
let isReady = false
while (true) {
  console.log('begin')
  if (isReady) {
    break
  }
  console.log('end')
}
`,

  'While If Continue': `
let isSuitable = false
while (true) {
  console.log('begin')
  if (isSuitable) {
    continue
  }
  console.log('end')
}
`,

  'Do While': `
let x = 1
do {
  x -= 1
} while (x > 0)
`,

  'Do While Break': `
let x = 1
do {
  x -= 1
  break
} while (x > 0)
`,

  'Do While Continue': `
let x = 1
do {
  x -= 1
  continue
} while (x > 0)
`,

  'For 0 0 0': `
for (/*     */; /*  */; /* */) {
  console.log('Yes')
}
`,

  'For 1 0 0': `
for (let i = 0; /*  */; /* */) {
  console.log(\`i = \${i}\`)
}
`,

  'For 0 1 0': `
let i = 0
for (/*     */; i < 10; /* */) {
  console.log(\`i = \${i}\`)
}
`,

  'For 1 1 0': `
for (let i = 0; i < 10; /* */) {
  console.log(\`i = \${i}\`)
}
`,

  'For 0 0 1': `
let i = 0
for (/*     */; /*  */; i++) {
  console.log(\`i = \${i}\`)
}
`,

  'For 1 0 1': `
for (let i = 0; /*  */; i++) {
  console.log(\`i = \${i}\`)
}
`,

  'For 0 1 1': `
let i = 0
for (/*     */; i < 10; i++) {
  console.log(\`i = \${i}\`)
}
`,

  'For 1 1 1': `
for (let i = 0; i < 10; i++) {
  console.log(\`i = \${i}\`)
}
`,

  'For 1 1 1 Break': `
for (let i = 0; i < 10; i++) {
  console.log(\`i = \${i}\`)
  break
}
`,

  'For 1 1 1 If Break': `
for (let i = 0; i < 10; i++) {
  if (i % 2 == 0) {
    break
  }
  console.log(\`i = \${i}\`)
}
`,

  'For 1 1 1 Continue': `
for (let i = 0; i < 10; i++) {
  console.log(\`i = \${i}\`)
  continue
}
`,

  'For 1 1 1 If Continue': `
for (let i = 0; i < 10; i++) {
  if (i % 2 == 0) {
    continue
  }
  console.log(\`i = \${i}\`)
}
`,

  /*
      x, y, z
      /     \
    x = y  x = z
      \      /
       log(x)
  */
  'Data Dependency If': `
let x = 1
let y = 1
let z = 1
if (x == 1) {
  x = y
} else {
  x = z
}
console.log(x)
`,

  'While (True) While (True)': `
while (true) {
  while (true) {
  }
}
`,
}
