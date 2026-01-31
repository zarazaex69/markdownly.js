import { describe, test, expect } from 'bun:test'
import { render } from '../src/renderer'
import { parse } from '../src/parser'
import * as ansi from '../src/ansi'

const stripAndNormalize = (text: string) => ansi.stripAnsi(text).replace(/\s+/g, ' ').trim()

describe('Renderer - Output Validation', () => {
  test('header rendering includes exact hash count and content', () => {
    const testCases = [
      { input: '# H1', expectedPrefix: '#', level: 1 },
      { input: '## H2', expectedPrefix: '##', level: 2 },
      { input: '### H3', expectedPrefix: '###', level: 3 }
    ]
    
    testCases.forEach(({ input, expectedPrefix, level }) => {
      const tokens = parse(input)
      const output = render(tokens)
      const stripped = ansi.stripAnsi(output)
      
      expect(stripped).toContain(expectedPrefix)
      expect(stripped).toContain(`H${level}`)
      
      const lines = stripped.split('\n').filter(l => l.trim())
      const headerLine = lines.find(l => l.includes(`H${level}`))
      expect(headerLine).toMatch(new RegExp(`^#{${level}}\\s+H${level}`))
    })
  })

  test('code block line numbers are sequential and accurate', () => {
    const codeLines = ['line1', 'line2', 'line3', 'line4', 'line5']
    const input = '```\n' + codeLines.join('\n') + '\n```'
    
    const tokens = parse(input)
    const output = render(tokens)
    const lines = output.split('\n')
    
    codeLines.forEach((codeLine, index) => {
      const lineNumber = index + 1
      const outputLine = lines.find(l => ansi.stripAnsi(l).includes(codeLine))
      expect(outputLine).toBeDefined()
      expect(ansi.stripAnsi(outputLine!)).toMatch(new RegExp(`^\\s*${lineNumber}\\s+${codeLine}`))
    })
  })

  test('list bullet types match nesting depth', () => {
    const input = `- Level 0
  - Level 1
    - Level 2
- Back to Level 0`
    
    const tokens = parse(input)
    const output = render(tokens)
    const lines = output.split('\n').filter(l => l.trim())
    
    const level0Lines = lines.filter(l => ansi.stripAnsi(l).includes('Level 0'))
    const level1Lines = lines.filter(l => ansi.stripAnsi(l).includes('Level 1'))
    const level2Lines = lines.filter(l => ansi.stripAnsi(l).includes('Level 2'))
    
    expect(level0Lines).toHaveLength(2)
    expect(level1Lines).toHaveLength(1)
    expect(level2Lines).toHaveLength(1)
    
    level0Lines.forEach(line => {
      expect(ansi.stripAnsi(line)).toMatch(/^•/)
    })
  })

  test('checkbox rendering shows correct symbols', () => {
    const input = `- [x] Completed
- [ ] Incomplete
- [X] Also completed`
    
    const tokens = parse(input)
    const output = render(tokens)
    const stripped = ansi.stripAnsi(output)
    
    const completedCount = (stripped.match(/✓/g) || []).length
    const incompleteCount = (stripped.match(/\[\s\]/g) || []).length
    
    expect(completedCount).toBe(2)
    expect(incompleteCount).toBe(1)
  })

  test('table borders form complete rectangle', () => {
    const input = `| A | B |
|---|---|
| 1 | 2 |`
    
    const tokens = parse(input)
    const output = render(tokens)
    const lines = output.split('\n').filter(l => l.trim())
    
    const tableLines = lines.filter(l => l.includes('│') || l.includes('┌') || l.includes('└'))
    expect(tableLines.length).toBeGreaterThan(3)
    
    const topBorder = tableLines.find(l => l.includes('┌'))
    const bottomBorder = tableLines.find(l => l.includes('└'))
    
    expect(topBorder).toBeDefined()
    expect(bottomBorder).toBeDefined()
  })

  test('blockquote indentation is consistent', () => {
    const input = `> Line 1
> Line 2
> Line 3`
    
    const tokens = parse(input)
    const output = render(tokens)
    const lines = output.split('\n').filter(l => l.trim())
    
    const quoteLines = lines.filter(l => ansi.stripAnsi(l).includes('Line'))
    
    quoteLines.forEach(line => {
      const stripped = ansi.stripAnsi(line)
      expect(stripped).toMatch(/^│\s/)
    })
  })

  test('text wrapping respects terminal width', () => {
    const longText = 'word '.repeat(50)
    const tokens = parse(longText.trim())
    const output = render(tokens)
    const lines = output.split('\n').filter(l => l.trim())
    
    const contentLines = lines.filter(l => ansi.stripAnsi(l).includes('word'))
    
    contentLines.forEach(line => {
      const visibleLength = ansi.visibleLength(line)
      expect(visibleLength).toBeLessThanOrEqual(122)
    })
    
    expect(contentLines.length).toBeGreaterThan(1)
  })

  test('inline formatting preserves text content', () => {
    const input = 'Text with **bold**, *italic*, and `code` formatting.'
    const tokens = parse(input)
    const output = render(tokens)
    const stripped = ansi.stripAnsi(output)
    
    expect(stripped).toContain('bold')
    expect(stripped).toContain('italic')
    expect(stripped).toContain('code')
    expect(stripped).toContain('formatting.')
    
    const words = stripped.split(/\s+/).filter(w => w.length > 0)
    expect(words).toContain('bold,')
    expect(words).toContain('italic,')
    expect(words).toContain('code')
  })

  test('alert types render with distinct visual markers', () => {
    const alertTypes = ['NOTE', 'WARNING', 'IMPORTANT', 'TIP', 'CAUTION']
    
    alertTypes.forEach(alertType => {
      const input = `> [!${alertType}]\n> This is ${alertType.toLowerCase()}`
      const tokens = parse(input)
      const output = render(tokens)
      const stripped = ansi.stripAnsi(output)
      
      expect(stripped).toContain(alertType.charAt(0).toUpperCase() + alertType.slice(1).toLowerCase())
      expect(stripped).toContain('│')
      expect(stripped).toContain('•')
    })
  })

  test('horizontal rule spans full width', () => {
    const tokens = parse('---')
    const output = render(tokens)
    const lines = output.split('\n').filter(l => l.trim())
    
    const hrLine = lines.find(l => l.includes('─'))
    expect(hrLine).toBeDefined()
    
    const hrLength = ansi.visibleLength(hrLine!)
    expect(hrLength).toBeGreaterThan(50)
  })

  test('empty input produces minimal output', () => {
    const tokens = parse('')
    const output = render(tokens)
    
    expect(output.trim()).toBe('')
  })

  test('output format consistency', () => {
    const input = `# Header

Paragraph text.

## Another header`
    
    const tokens = parse(input)
    const output = render(tokens)
    
    expect(output.startsWith('\n')).toBe(true)
    expect(output.endsWith('\n\n')).toBe(true)
    
    const sections = output.split('\n\n').filter(s => s.trim())
    expect(sections.length).toBeGreaterThan(0)
  })

  test('nested list indentation increases progressively', () => {
    const input = `- Level 0
  - Level 1
    - Level 2
      - Level 3`
    
    const tokens = parse(input)
    const output = render(tokens)
    const lines = output.split('\n').filter(l => l.trim())
    
    const level0 = lines.find(l => ansi.stripAnsi(l).includes('Level 0'))
    const level1 = lines.find(l => ansi.stripAnsi(l).includes('Level 1'))
    const level2 = lines.find(l => ansi.stripAnsi(l).includes('Level 2'))
    const level3 = lines.find(l => ansi.stripAnsi(l).includes('Level 3'))
    
    const getIndent = (line: string) => line.match(/^(\s*)/)?.[1].length || 0
    
    const indent0 = getIndent(ansi.stripAnsi(level0!))
    const indent1 = getIndent(ansi.stripAnsi(level1!))
    const indent2 = getIndent(ansi.stripAnsi(level2!))
    const indent3 = getIndent(ansi.stripAnsi(level3!))
    
    expect(indent1).toBeGreaterThan(indent0)
    expect(indent2).toBeGreaterThan(indent1)
    expect(indent3).toBeGreaterThan(indent2)
  })
})