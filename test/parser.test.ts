import { describe, test, expect } from 'bun:test'
import { parse, parseInline, type Token } from '../src/parser'

const generateRandomString = (length: number) => 
  Array.from({ length }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join('')

const generateHeaders = (count: number) => 
  Array.from({ length: count }, (_, i) => ({
    level: (i % 6) + 1,
    content: generateRandomString(10 + Math.floor(Math.random() * 20))
  }))

describe('Parser - Property Based Tests', () => {
  describe('Headers', () => {
    test('header level maps exactly to hash count', () => {
      for (let level = 1; level <= 6; level++) {
        const hashes = '#'.repeat(level)
        const content = generateRandomString(20)
        const input = `${hashes} ${content}`
        
        const [token] = parse(input)
        
        expect(token.type).toBe(`h${level}`)
        expect(token.content).toBe(content)
      }
    })

    test('any input with 7+ hashes becomes paragraph', () => {
      for (let hashCount = 7; hashCount <= 10; hashCount++) {
        const input = '#'.repeat(hashCount) + ' content'
        const [token] = parse(input)
        
        expect(token.type).toBe('paragraph')
        expect(token.content).toBe(input)
      }
    })

    test('header without space after hashes becomes paragraph', () => {
      const testCases = ['#content', '##content', '###content']
      
      testCases.forEach(input => {
        const [token] = parse(input)
        expect(token.type).toBe('paragraph')
        expect(token.content).toBe(input)
      })
    })

    test('multiple headers preserve order and content', () => {
      const headers = generateHeaders(10)
      const input = headers.map(h => `${'#'.repeat(h.level)} ${h.content}`).join('\n')
      
      const tokens = parse(input)
      
      expect(tokens).toHaveLength(headers.length)
      headers.forEach((header, i) => {
        expect(tokens[i].type).toBe(`h${header.level}`)
        expect(tokens[i].content).toBe(header.content)
      })
    })
  })

  describe('Code blocks', () => {
    test('fenced blocks preserve exact whitespace and content', () => {
      const codeLines = [
        '  function test() {',
        '    const x = 1',
        '    return x + 2',
        '  }'
      ]
      const expectedContent = codeLines.join('\n')
      const input = `\`\`\`javascript\n${expectedContent}\n\`\`\``
      
      const [token] = parse(input)
      
      expect(token.type).toBe('code_block')
      expect(token.content).toBe(expectedContent)
      expect(token.meta?.lang).toBe('javascript')
    })

    test('indented blocks strip exactly 4 spaces from each line', () => {
      const input = `    line1
    line2
        indented_line
    line3`
      
      const [token] = parse(input)
      
      expect(token.type).toBe('code_block')
      expect(token.content).toBe('line1\nline2\n    indented_line\nline3')
    })

    test('mixed indented and empty lines handled correctly', () => {
      const input = `    code line 1

    code line 2
    
    code line 3`
      
      const [token] = parse(input)
      
      expect(token.type).toBe('code_block')
      const lines = token.content.split('\n')
      expect(lines).toHaveLength(5)
      expect(lines[1]).toBe('')
      expect(lines[3]).toBe('')
    })

    test('unclosed fenced block consumes rest of input', () => {
      const input = `\`\`\`python
def func():
    return 42

print("hello")
more content here`
      
      const [token] = parse(input)
      
      expect(token.type).toBe('code_block')
      expect(token.content).toContain('def func():')
      expect(token.content).toContain('more content here')
    })

    test('language extraction handles edge cases', () => {
      const testCases = [
        { input: '```js\ncode\n```', expectedLang: 'js' },
        { input: '```  typescript  \ncode\n```', expectedLang: 'typescript' },
        { input: '```\ncode\n```', expectedLang: '' },
        { input: '```123invalid\ncode\n```', expectedLang: '123invalid' }
      ]
      
      testCases.forEach(({ input, expectedLang }) => {
        const [token] = parse(input)
        expect(token.meta?.lang).toBe(expectedLang)
      })
    })
  })

  describe('Lists - Behavioral Tests', () => {
    test('list nesting depth calculated by indentation', () => {
      const input = `- Level 0
  - Level 1 (2 spaces)
    - Level 2 (4 spaces)
      - Level 3 (6 spaces)
- Back to Level 0`
      
      const [listToken] = parse(input)
      const items = listToken.children!
      
      expect(items[0].meta?.depth).toBe(0)
      expect(items[0].meta?.nested).toBeDefined()
      
      const nested1 = items[0].meta!.nested[0]
      expect(nested1.meta?.depth).toBe(1)
      expect(nested1.meta?.nested).toBeDefined()
      
      const nested2 = nested1.meta!.nested[0]
      expect(nested2.meta?.depth).toBe(2)
    })

    test('checkbox state parsing is exact', () => {
      const testCases = [
        { input: '- [x] Checked', expected: true },
        { input: '- [X] Also checked', expected: true },
        { input: '- [ ] Unchecked', expected: false },
        { input: '- [y] Invalid char', expected: undefined }
      ]
      
      testCases.forEach(({ input, expected }) => {
        const [listToken] = parse(input)
        const item = listToken.children![0]
        expect(item.meta?.checked).toBe(expected)
      })
    })

    test('ordered list numbering preserved', () => {
      const input = `5. Start at five
6. Next is six
10. Jump to ten`
      
      const [listToken] = parse(input)
      const items = listToken.children!
      
      expect(items[0].meta?.start).toBe(5)
      expect(items[1].meta?.start).toBe(6)
      expect(items[2].meta?.start).toBe(10)
      items.forEach(item => expect(item.meta?.ordered).toBe(true))
    })

    test('mixed list types handled in single list', () => {
      const input = `- Unordered item
1. Ordered item
- Another unordered`
      
      const tokens = parse(input)
      
      expect(tokens).toHaveLength(1)
      expect(tokens[0].type).toBe('list')
      expect(tokens[0].children).toHaveLength(3)
      
      const items = tokens[0].children!
      expect(items[0].meta?.ordered).toBe(false)
      expect(items[1].meta?.ordered).toBe(true)
      expect(items[2].meta?.ordered).toBe(false)
    })

    test('list item content excludes markers and checkboxes', () => {
      const testCases = [
        { input: '- Simple item', expected: 'Simple item' },
        { input: '1. Numbered item', expected: 'Numbered item' },
        { input: '- [x] Checked item', expected: 'Checked item' },
        { input: '  - Indented item', expected: 'Indented item' }
      ]
      
      testCases.forEach(({ input, expected }) => {
        const [listToken] = parse(input)
        const item = listToken.children![0]
        expect(item.content).toBe(expected)
      })
    })
  })

  describe('Tables - Structure Validation', () => {
    test('table parsing extracts exact cell content', () => {
      const input = `| Name | Age | City |
|------|-----|------|
| John | 25  | NYC  |
| Jane | 30  | LA   |`
      
      const [token] = parse(input)
      const { headers, rows } = token.meta!.rows
      
      expect(headers).toEqual(['Name', 'Age', 'City'])
      expect(rows).toEqual([
        ['John', '25', 'NYC'],
        ['Jane', '30', 'LA']
      ])
    })

    test('alignment detection from separator row', () => {
      const testCases = [
        { sep: '|:-----|:----:|-----:|', expected: ['left', 'center', 'right'] },
        { sep: '|------|------|------|', expected: ['left', 'left', 'left'] },
        { sep: '|:-----|------|:----:|', expected: ['left', 'left', 'center'] }
      ]
      
      testCases.forEach(({ sep, expected }) => {
        const input = `| A | B | C |\n${sep}\n| 1 | 2 | 3 |`
        const [token] = parse(input)
        expect(token.meta!.rows.alignments).toEqual(expected)
      })
    })

    test('table cell trimming removes whitespace', () => {
      const input = `|  Name  |  Age  |
|--------|-------|
|  John  |  25   |`
      
      const [token] = parse(input)
      const { headers, rows } = token.meta!.rows
      
      expect(headers).toEqual(['Name', 'Age'])
      expect(rows[0]).toEqual(['John', '25'])
    })
  })

  describe('Inline Parser - Basic Tests', () => {
    test('bold text extraction', () => {
      const tokens = parseInline('**bold text**')
      const boldToken = tokens.find(t => t.type === 'bold')
      
      expect(boldToken).toBeDefined()
      expect(boldToken!.content).toBe('bold text')
    })

    test('italic text extraction', () => {
      const tokens = parseInline('*italic text*')
      const italicToken = tokens.find(t => t.type === 'italic')
      
      expect(italicToken).toBeDefined()
      expect(italicToken!.content).toBe('italic text')
    })

    test('code inline extraction', () => {
      const tokens = parseInline('`code text`')
      const codeToken = tokens.find(t => t.type === 'code_inline')
      
      expect(codeToken).toBeDefined()
      expect(codeToken!.content).toBe('code text')
    })

    test('link parsing', () => {
      const tokens = parseInline('[text](url)')
      const linkToken = tokens.find(t => t.type === 'link')
      
      expect(linkToken).toBeDefined()
      expect(linkToken!.content).toBe('text')
      expect(linkToken!.meta?.url).toBe('url')
    })

    test('image parsing', () => {
      const tokens = parseInline('![alt](url)')
      const imageToken = tokens.find(t => t.type === 'image')
      
      expect(imageToken).toBeDefined()
      expect(imageToken!.content).toBe('alt')
      expect(imageToken!.meta?.url).toBe('url')
    })

    test('strikethrough parsing', () => {
      const tokens = parseInline('~~strike~~')
      const strikeToken = tokens.find(t => t.type === 'strikethrough')
      
      expect(strikeToken).toBeDefined()
      expect(strikeToken!.content).toBe('strike')
    })

    test('superscript parsing', () => {
      const tokens = parseInline('x^2^')
      const supToken = tokens.find(t => t.type === 'sup')
      
      expect(supToken).toBeDefined()
      expect(supToken!.content).toBe('2')
    })

    test('subscript parsing', () => {
      const tokens = parseInline('H~2~O')
      const subToken = tokens.find(t => t.type === 'sub')
      
      expect(subToken).toBeDefined()
      expect(subToken!.content).toBe('2')
    })
  })
})