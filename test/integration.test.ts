import { describe, test, expect } from 'bun:test'
import { markdown } from '../src/index'
import * as ansi from '../src/ansi'

describe('Integration Tests', () => {
  test('processes simple markdown document', () => {
    const input = `# Title

This is **bold** text.

## Code

\`\`\`js
const x = 1
\`\`\`

- Item 1
- Item 2`

    const output = markdown(input)
    const stripped = ansi.stripAnsi(output)
    
    expect(stripped).toContain('Title')
    expect(stripped).toContain('bold')
    expect(stripped).toContain('const x = 1')
    expect(stripped).toContain('Item 1')
  })

  test('handles empty input', () => {
    expect(() => markdown('')).not.toThrow()
    expect(markdown('').trim()).toBe('')
  })

  test('handles basic formatting', () => {
    const input = '**bold** *italic* `code`'
    const output = markdown(input)
    const stripped = ansi.stripAnsi(output)
    
    expect(stripped).toContain('bold')
    expect(stripped).toContain('italic')
    expect(stripped).toContain('code')
  })
})