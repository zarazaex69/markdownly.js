export type TokenType = 
  | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  | 'paragraph' | 'blockquote' | 'code_block' | 'code_inline'
  | 'hr' | 'list' | 'list_item' | 'table'
  | 'alert' | 'text' | 'bold' | 'italic' | 'strikethrough'
  | 'link' | 'image' | 'checkbox' | 'br'
  | 'sup' | 'sub' | 'mark' | 'ins'

export interface Token {
  type: TokenType
  content: string
  children?: Token[]
  meta?: Record<string, any>
}

export function parse(markdown: string): Token[] {
  const lines = markdown.split('\n')
  const tokens: Token[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    
    if (line.trim() === '') {
      i++
      continue
    }

    // code block (fenced)
    if (line.match(/^```/)) {
      const lang = line.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].match(/^```/)) {
        codeLines.push(lines[i])
        i++
      }
      tokens.push({
        type: 'code_block',
        content: codeLines.join('\n'),
        meta: { lang }
      })
      i++
      continue
    }

    // code block (indented)
    if (line.match(/^    /)) {
      const codeLines: string[] = []
      while (i < lines.length && (lines[i].match(/^    /) || lines[i].trim() === '')) {
        codeLines.push(lines[i].replace(/^    /, ''))
        i++
      }
      tokens.push({
        type: 'code_block',
        content: codeLines.join('\n').trim(),
        meta: { lang: '' }
      })
      continue
    }

    // headers
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (headerMatch) {
      const level = headerMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6
      tokens.push({
        type: `h${level}` as TokenType,
        content: headerMatch[2],
        children: parseInline(headerMatch[2])
      })
      i++
      continue
    }

    // hr
    if (line.match(/^(\*{3,}|-{3,}|_{3,})$/)) {
      tokens.push({ type: 'hr', content: '' })
      i++
      continue
    }

    // alert (github style)
    const alertMatch = line.match(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/)
    if (alertMatch) {
      const alertType = alertMatch[1].toLowerCase()
      const alertLines: string[] = []
      i++
      while (i < lines.length && lines[i].match(/^>/)) {
        alertLines.push(lines[i].replace(/^>\s?/, ''))
        i++
      }
      tokens.push({
        type: 'alert',
        content: alertLines.join('\n'),
        meta: { alertType },
        children: parseInline(alertLines.join('\n'))
      })
      continue
    }

    // blockquote
    if (line.match(/^>/)) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].match(/^>/)) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''))
        i++
      }
      tokens.push({
        type: 'blockquote',
        content: quoteLines.join('\n'),
        children: parse(quoteLines.join('\n'))
      })
      continue
    }

    // table
    if (i + 1 < lines.length && lines[i + 1].match(/^\|?[\s\-:|]+\|?$/)) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].includes('|')) {
        tableLines.push(lines[i])
        i++
      }
      tokens.push({
        type: 'table',
        content: '',
        meta: { rows: parseTable(tableLines) }
      })
      continue
    }

    // list (unordered or ordered)
    const listMatch = line.match(/^(\s*)([*+-]|\d+\.)\s/)
    if (listMatch) {
      const { items, endIndex } = parseList(lines, i)
      tokens.push({
        type: 'list',
        content: '',
        children: items
      })
      i = endIndex
      continue
    }

    // paragraph
    const paraLines: string[] = []
    while (i < lines.length && 
           lines[i].trim() !== '' && 
           !lines[i].match(/^(#{1,6}\s|```|>|\*{3,}|-{3,}|_{3,}|(\s*)([*+-]|\d+\.)\s|\|)/)
    ) {
      paraLines.push(lines[i])
      i++
    }
    if (paraLines.length > 0) {
      const content = paraLines.join('\n')
      tokens.push({
        type: 'paragraph',
        content,
        children: parseInline(content)
      })
    }
  }

  return tokens
}

function parseList(lines: string[], startIndex: number): { items: Token[], endIndex: number } {
  const items: Token[] = []
  let i = startIndex
  
  // get base indent level
  const firstMatch = lines[i].match(/^(\s*)/)
  const baseIndent = firstMatch ? firstMatch[1].length : 0
  
  while (i < lines.length) {
    const line = lines[i]
    
    if (line.trim() === '') {
      i++
      continue
    }
    
    const match = line.match(/^(\s*)([*+-]|(\d+)\.)\s(.*)$/)
    if (!match) break
    
    const [, indentStr, marker, startNum, content] = match
    const indent = indentStr.length
    
    // if less indented than base, we're done with this list
    if (indent < baseIndent) break
    
    const ordered = /\d+\./.test(marker)
    const start = startNum ? parseInt(startNum, 10) : 1
    const depth = Math.floor(indent / 2)
    
    const checked = content.match(/^\[([ xX])\]\s*(.*)$/)
    let itemContent = checked ? checked[2] : content
    const isChecked = checked ? checked[1].toLowerCase() === 'x' : undefined
    
    i++
    
    // check for nested list
    const nestedItems: Token[] = []
    while (i < lines.length) {
      const nextLine = lines[i]
      
      if (nextLine.trim() === '') {
        i++
        continue
      }
      
      const nextMatch = nextLine.match(/^(\s*)([*+-]|\d+\.)\s/)
      if (!nextMatch) break
      
      const nextIndent = nextMatch[1].length
      
      // nested list - more indented
      if (nextIndent > indent) {
        const nested = parseList(lines, i)
        nestedItems.push(...nested.items)
        i = nested.endIndex
        continue
      }
      
      // same or less indent - back to parent
      break
    }
    
    const item: Token = {
      type: 'list_item',
      content: itemContent,
      children: parseInline(itemContent),
      meta: { ordered, checked: isChecked, depth, start }
    }
    
    if (nestedItems.length > 0) {
      item.meta!.nested = nestedItems
    }
    
    items.push(item)
  }
  
  return { items, endIndex: i }
}

function parseTable(lines: string[]): { headers: string[], alignments: string[], rows: string[][] } {
  const parseRow = (line: string): string[] => 
    line.split('|').map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1 || arr.length <= 2)
  
  const headers = parseRow(lines[0])
  const alignLine = lines[1]
  const alignments = parseRow(alignLine).map(cell => {
    if (cell.startsWith(':') && cell.endsWith(':')) return 'center'
    if (cell.endsWith(':')) return 'right'
    return 'left'
  })
  
  const rows = lines.slice(2).map(parseRow)
  
  return { headers, alignments, rows }
}

export function parseInline(text: string): Token[] {
  const tokens: Token[] = []
  let remaining = text
  
  while (remaining.length > 0) {
    if (remaining.startsWith('\\') && remaining.length > 1) {
      const escaped = remaining[1]
      if ('*_`~[]!^=+\\'.includes(escaped)) {
        tokens.push({ type: 'text', content: escaped })
        remaining = remaining.slice(2)
        continue
      }
    }
    
    const imgMatch = remaining.match(/^!\[([^\]]*)\]\(([^)]+)\)/)
    if (imgMatch) {
      tokens.push({
        type: 'image',
        content: imgMatch[1] || 'Image',
        meta: { url: imgMatch[2] }
      })
      remaining = remaining.slice(imgMatch[0].length)
      continue
    }
    
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/)
    if (linkMatch) {
      tokens.push({
        type: 'link',
        content: linkMatch[1],
        meta: { url: linkMatch[2] }
      })
      remaining = remaining.slice(linkMatch[0].length)
      continue
    }
    
    const codeMatch = remaining.match(/^`([^`]+)`/)
    if (codeMatch) {
      tokens.push({ type: 'code_inline', content: codeMatch[1] })
      remaining = remaining.slice(codeMatch[0].length)
      continue
    }
    
    const boldMatch = remaining.match(/^(\*\*|__)(.+?)\1/)
    if (boldMatch) {
      tokens.push({ 
        type: 'bold', 
        content: boldMatch[2],
        children: parseInline(boldMatch[2])
      })
      remaining = remaining.slice(boldMatch[0].length)
      continue
    }
    
    const italicMatch = remaining.match(/^(\*|_)(?!\s)(.+?)(?<!\s)\1(?![*_])/)
    if (italicMatch) {
      tokens.push({ 
        type: 'italic', 
        content: italicMatch[2],
        children: parseInline(italicMatch[2])
      })
      remaining = remaining.slice(italicMatch[0].length)
      continue
    }
    
    const strikeMatch = remaining.match(/^~~(.+?)~~/)
    if (strikeMatch) {
      tokens.push({ type: 'strikethrough', content: strikeMatch[1] })
      remaining = remaining.slice(strikeMatch[0].length)
      continue
    }
    
    const markMatch = remaining.match(/^==(.+?)==/)
    if (markMatch) {
      tokens.push({ type: 'mark', content: markMatch[1] })
      remaining = remaining.slice(markMatch[0].length)
      continue
    }
    
    const insMatch = remaining.match(/^\+\+(.+?)\+\+/)
    if (insMatch) {
      tokens.push({ type: 'ins', content: insMatch[1] })
      remaining = remaining.slice(insMatch[0].length)
      continue
    }
    
    const supMatch = remaining.match(/^\^([^^]+)\^/)
    if (supMatch) {
      tokens.push({ type: 'sup', content: supMatch[1] })
      remaining = remaining.slice(supMatch[0].length)
      continue
    }
    
    const subMatch = remaining.match(/^~([^~\s]+)~/)
    if (subMatch) {
      tokens.push({ type: 'sub', content: subMatch[1] })
      remaining = remaining.slice(subMatch[0].length)
      continue
    }
    
    if (remaining.startsWith('\n')) {
      tokens.push({ type: 'br', content: '\n' })
      remaining = remaining.slice(1)
      continue
    }
    
    const nextSpecial = remaining.slice(1).search(/[\\*_`~\[!\^=+\n]/)
    const end = nextSpecial === -1 ? remaining.length : nextSpecial + 1
    tokens.push({ type: 'text', content: remaining.slice(0, end) })
    remaining = remaining.slice(end)
  }
  
  return tokens
}
