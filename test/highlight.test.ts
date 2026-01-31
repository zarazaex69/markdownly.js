import { describe, test, expect } from 'bun:test'
import { highlight } from '../src/highlight'
import * as ansi from '../src/ansi'

describe('Syntax Highlighter', () => {
  test('highlights JavaScript code', () => {
    const code = `const x = 1
function test() {
  return "hello"
}`
    
    const highlighted = highlight(code, 'javascript')
    const stripped = ansi.stripAnsi(highlighted)
    
    expect(stripped).toContain('const')
    expect(stripped).toContain('function')
    expect(stripped).toContain('return')
  })

  test('highlights TypeScript code', () => {
    const code = `interface User {
  name: string
  age: number
}

const user: User = { name: "John", age: 30 }`
    
    const highlighted = highlight(code, 'typescript')
    const stripped = ansi.stripAnsi(highlighted)
    
    expect(stripped).toContain('interface')
    expect(stripped).toContain('string')
    expect(stripped).toContain('number')
  })

  test('highlights Python code', () => {
    const code = `def hello(name):
    return f"Hello, {name}!"

if __name__ == "__main__":
    print(hello("World"))`
    
    const highlighted = highlight(code, 'python')
    const stripped = ansi.stripAnsi(highlighted)
    
    expect(stripped).toContain('def')
    expect(stripped).toContain('return')
    expect(stripped).toContain('if')
  })

  test('highlights Go code', () => {
    const code = `package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}`
    
    const highlighted = highlight(code, 'go')
    const stripped = ansi.stripAnsi(highlighted)
    
    expect(stripped).toContain('package')
    expect(stripped).toContain('import')
    expect(stripped).toContain('func')
  })

  test('highlights Rust code', () => {
    const code = `fn main() {
    let x = 5;
    println!("x = {}", x);
}`
    
    const highlighted = highlight(code, 'rust')
    const stripped = ansi.stripAnsi(highlighted)
    
    expect(stripped).toContain('fn')
    expect(stripped).toContain('let')
    expect(stripped).toContain('println!')
  })

  test('highlights JSON', () => {
    const code = `{
  "name": "test",
  "version": 1,
  "active": true,
  "data": null
}`
    
    const highlighted = highlight(code, 'json')
    const stripped = ansi.stripAnsi(highlighted)
    
    expect(stripped).toContain('"name"')
    expect(stripped).toContain('true')
    expect(stripped).toContain('null')
  })

  test('highlights YAML', () => {
    const code = `name: test
version: 1.0
features:
  - auth
  - api
enabled: true`
    
    const highlighted = highlight(code, 'yaml')
    const stripped = ansi.stripAnsi(highlighted)
    
    expect(stripped).toContain('name:')
    expect(stripped).toContain('version:')
    expect(stripped).toContain('true')
  })

  test('highlights HTML', () => {
    const code = `<div class="container">
  <h1>Title</h1>
  <p>Content</p>
</div>`
    
    const highlighted = highlight(code, 'html')
    const stripped = ansi.stripAnsi(highlighted)
    
    expect(stripped).toContain('<div')
    expect(stripped).toContain('class=')
    expect(stripped).toContain('</div>')
  })

  test('highlights CSS', () => {
    const code = `.container {
  display: flex;
  color: #333;
  font-size: 16px;
}`
    
    const highlighted = highlight(code, 'css')
    const stripped = ansi.stripAnsi(highlighted)
    
    expect(stripped).toContain('.container')
    expect(stripped).toContain('display')
    expect(stripped).toContain('#333')
  })

  test('highlights SQL', () => {
    const code = `SELECT name, age 
FROM users 
WHERE age > 18 
ORDER BY name ASC`
    
    const highlighted = highlight(code, 'sql')
    const stripped = ansi.stripAnsi(highlighted)
    
    expect(stripped).toContain('SELECT')
    expect(stripped).toContain('FROM')
    expect(stripped).toContain('WHERE')
  })

  test('highlights bash/shell', () => {
    const code = `#!/bin/bash
echo "Hello World"
if [ -f "file.txt" ]; then
  cat file.txt
fi`
    
    const highlighted = highlight(code, 'bash')
    const stripped = ansi.stripAnsi(highlighted)
    
    expect(stripped).toContain('echo')
    expect(stripped).toContain('if')
    expect(stripped).toContain('cat')
  })

  test('highlights Dockerfile', () => {
    const code = `FROM node:18
WORKDIR /app
COPY package.json .
RUN npm install
EXPOSE 3000
CMD ["npm", "start"]`
    
    const highlighted = highlight(code, 'dockerfile')
    const stripped = ansi.stripAnsi(highlighted)
    
    expect(stripped).toContain('FROM')
    expect(stripped).toContain('WORKDIR')
    expect(stripped).toContain('RUN')
  })

  test('handles unknown languages gracefully', () => {
    const code = 'some random code'
    const highlighted = highlight(code, 'unknown-lang')
    
    expect(highlighted).toBeDefined()
    expect(ansi.stripAnsi(highlighted)).toBe(code)
  })

  test('handles empty code', () => {
    const highlighted = highlight('', 'javascript')
    
    expect(highlighted).toBe('')
  })

  test('preserves whitespace and formatting', () => {
    const code = `  const x = 1
    const y = 2`
    
    const highlighted = highlight(code, 'javascript')
    const stripped = ansi.stripAnsi(highlighted)
    
    expect(stripped).toContain('  const x')
    expect(stripped).toContain('    const y')
  })

  test('handles comments correctly', () => {
    const jsCode = `// This is a comment
const x = 1 /* block comment */`
    
    const highlighted = highlight(jsCode, 'javascript')
    const stripped = ansi.stripAnsi(highlighted)
    
    expect(stripped).toContain('// This is a comment')
    expect(stripped).toContain('/* block comment */')
  })

  test('handles strings with special characters', () => {
    const code = `const str = "Hello \"world\" with \\n newline"`
    
    const highlighted = highlight(code, 'javascript')
    const stripped = ansi.stripAnsi(highlighted)
    
    expect(stripped).toContain('"world"')
    expect(stripped).toContain('\\n')
  })

  test('handles regex patterns', () => {
    const code = `const regex = /[a-zA-Z0-9]+/g`
    
    const highlighted = highlight(code, 'javascript')
    const stripped = ansi.stripAnsi(highlighted)
    
    expect(stripped).toContain('/[a-zA-Z0-9]+/g')
  })
})