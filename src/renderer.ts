// renderer - converts tokens to terminal output

import * as ansi from './ansi'
import { highlight } from './highlight'
import { Token, parseInline } from './parser'

const getWidth = (): number => Math.min(120, ansi.getTerminalWidth() - 2)

export function render(tokens: Token[]): string {
  const lines: string[] = []
  const width = getWidth()
  
  for (const token of tokens) {
    const rendered = renderToken(token, { width, indent: '' })
    if (rendered) lines.push(rendered)
  }
  
  return '\n' + lines.join('\n\n') + '\n\n'
}

interface Context {
  width: number
  indent: string
}

function renderToken(token: Token, ctx: Context): string {
  switch (token.type) {
    case 'h1':
      return `${ansi.compose(ansi.red, ansi.bold)('#')} ${renderInline(token.children || [])}`
    
    case 'h2':
      return `${ansi.compose(ansi.blue, ansi.bold)('##')} ${renderInline(token.children || [])}`
    
    case 'h3':
      return `${ansi.compose(ansi.blue, ansi.bold)('###')} ${renderInline(token.children || [])}`
    
    case 'h4':
      return `${ansi.compose(ansi.cyan, ansi.bold)('####')} ${renderInline(token.children || [])}`
    
    case 'h5':
      return `${ansi.cyan('#####')} ${renderInline(token.children || [])}`
    
    case 'h6':
      return `${ansi.cyan('######')} ${renderInline(token.children || [])}`
    
    case 'paragraph':
      return wrapText(renderInline(token.children || []), ctx.width)
    
    case 'hr':
      return ansi.grey('─'.repeat(ctx.width))
    
    case 'blockquote':
      return renderBlockquote(token, ctx)
    
    case 'alert':
      return renderAlert(token, ctx)
    
    case 'code_block':
      return renderCodeBlock(token, ctx)
    
    case 'list':
      return renderList(token, ctx)
    
    case 'table':
      return renderTable(token, ctx)
    
    default:
      return token.content
  }
}

function renderInline(tokens: Token[]): string {
  return tokens.map(t => {
    switch (t.type) {
      case 'text':
        return t.content
      case 'bold':
        return ansi.bold(renderInline(t.children || [{ type: 'text', content: t.content }]))
      case 'italic':
        return ansi.italic(renderInline(t.children || [{ type: 'text', content: t.content }]))
      case 'strikethrough':
        return ansi.strikethrough(t.content)
      case 'code_inline':
        return ansi.compose(ansi.bgBlack, ansi.yellowBright)(t.content)
      case 'link':
        return ansi.compose(ansi.blue, ansi.underline)(t.content)
      case 'image':
        return ansi.cyan('!') + ansi.grey('[') + ansi.cyan(t.content) + ansi.grey(']')
      case 'mark':
        return ansi.compose(ansi.bgYellow, ansi.black)(t.content)
      case 'ins':
        return ansi.compose(ansi.bgGreen, ansi.black)(t.content)
      case 'sup':
      case 'sub':
        return t.content
      case 'br':
        return '\n'
      default:
        return t.content
    }
  }).join('')
}

function renderBlockquote(token: Token, ctx: Context): string {
  const innerCtx = { ...ctx, width: ctx.width - 2 }
  const content = token.children 
    ? token.children.map(t => renderToken(t, innerCtx)).join('\n\n')
    : token.content
  
  return content.split('\n').map(line => 
    ansi.grey('│ ') + line
  ).join('\n')
}

function renderAlert(token: Token, ctx: Context): string {
  const alertType = token.meta?.alertType || 'note'
  
  const colors: Record<string, (s: string) => string> = {
    note: ansi.blue,
    tip: ansi.green,
    important: ansi.red,
    warning: ansi.yellow,
    caution: ansi.magenta,
  }
  
  const color = colors[alertType] || ansi.blue
  const title = alertType.charAt(0).toUpperCase() + alertType.slice(1)
  
  const innerCtx = { ...ctx, width: ctx.width - 2 }
  const content = wrapText(renderInline(token.children || []), innerCtx.width)
  
  const lines = [
    color('│ ') + color(`• ${title}`),
    ...content.split('\n').map(line => color('│ ') + line)
  ]
  
  return lines.join('\n')
}

function renderCodeBlock(token: Token, ctx: Context): string {
  const lang = token.meta?.lang || ''
  const code = token.content
  const highlighted = lang ? highlight(code, lang) : ansi.yellowBright(code)
  
  const lines = highlighted.split('\n')
  const numWidth = String(lines.length).length
  
  return lines.map((line, i) => {
    const num = ansi.compose(ansi.grey, ansi.dim)(String(i + 1).padStart(numWidth))
    return ` ${num} ${line}`
  }).join('\n')
}

function renderList(token: Token, ctx: Context): string {
  const items = token.children || []
  let orderedNum = 1
  
  return items.map(item => {
    const ordered = item.meta?.ordered
    const checked = item.meta?.checked
    
    let bullet: string
    if (checked !== undefined) {
      const check = checked ? ansi.green('✓') : ' '
      bullet = ansi.grey('[') + check + ansi.grey(']')
    } else if (ordered) {
      bullet = ansi.blueBright(`${orderedNum++}.`)
    } else {
      bullet = ansi.redBright('•')
    }
    
    const content = renderInline(item.children || [])
    const wrapped = wrapText(content, ctx.width - 4)
    const indented = wrapped.split('\n').map((line, i) => 
      i === 0 ? `${bullet} ${line}` : `    ${line}`
    ).join('\n')
    
    return indented
  }).join('\n')
}

function renderTable(token: Token, ctx: Context): string {
  const { headers, alignments, rows } = token.meta?.rows || { headers: [], alignments: [], rows: [] }
  
  if (!headers.length) return ''
  
  // calculate column widths
  const colWidths = headers.map((h: string, i: number) => {
    const cellWidths = [h.length, ...rows.map((r: string[]) => (r[i] || '').length)]
    return Math.max(...cellWidths)
  })
  
  const pad = (s: string, w: number, align: string): string => {
    const diff = w - s.length
    if (diff <= 0) return s
    if (align === 'center') {
      const left = Math.floor(diff / 2)
      return ' '.repeat(left) + s + ' '.repeat(diff - left)
    }
    if (align === 'right') return ' '.repeat(diff) + s
    return s + ' '.repeat(diff)
  }
  
  const renderRow = (cells: string[], isHeader = false): string => {
    const styled = cells.map((cell, i) => {
      const padded = pad(cell, colWidths[i], alignments[i] || 'left')
      return isHeader ? ansi.compose(ansi.bold, ansi.red)(padded) : padded
    })
    return '│ ' + styled.join(' │ ') + ' │'
  }
  
  const separator = '├' + colWidths.map(w => '─'.repeat(w + 2)).join('┼') + '┤'
  const top = '┌' + colWidths.map(w => '─'.repeat(w + 2)).join('┬') + '┐'
  const bottom = '└' + colWidths.map(w => '─'.repeat(w + 2)).join('┴') + '┘'
  
  const tableLines = [
    top,
    renderRow(headers, true),
    separator,
    ...rows.map((r: string[]) => renderRow(r)),
    bottom
  ]
  
  return tableLines.join('\n')
}

function wrapText(text: string, width: number): string {
  if (width <= 0) return text
  
  const lines: string[] = []
  
  for (const paragraph of text.split('\n')) {
    if (stripAnsi(paragraph).length <= width) {
      lines.push(paragraph)
      continue
    }
    
    // simple word wrap - not perfect with ansi but good enough
    const words = paragraph.split(' ')
    let current = ''
    
    for (const word of words) {
      const test = current ? current + ' ' + word : word
      if (stripAnsi(test).length <= width) {
        current = test
      } else {
        if (current) lines.push(current)
        current = word
      }
    }
    if (current) lines.push(current)
  }
  
  return lines.join('\n')
}

function stripAnsi(s: string): string {
  return s.replace(/\x1b\[[0-9;]*m/g, '')
}
