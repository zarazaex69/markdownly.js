// simple syntax highlighter - zero deps

import * as ansi from './ansi'

export function highlight(code: string, lang: string): string {
  const l = lang.toLowerCase()
  
  if (['js', 'javascript', 'ts', 'typescript', 'jsx', 'tsx'].includes(l)) {
    return highlightJS(code)
  }
  if (['go', 'golang'].includes(l)) {
    return highlightGo(code)
  }
  if (['py', 'python'].includes(l)) {
    return highlightPython(code)
  }
  if (['sh', 'bash', 'shell', 'zsh'].includes(l)) {
    return highlightBash(code)
  }
  if (['json'].includes(l)) {
    return highlightJSON(code)
  }
  if (['yaml', 'yml'].includes(l)) {
    return highlightYAML(code)
  }
  if (['html', 'xml'].includes(l)) {
    return highlightHTML(code)
  }
  if (['css', 'scss', 'less'].includes(l)) {
    return highlightCSS(code)
  }
  
  return ansi.yellowBright(code)
}

function highlightJS(code: string): string {
  const keywords = /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|this|class|extends|import|export|from|default|async|await|try|catch|finally|throw|typeof|instanceof|in|of|null|undefined|true|false|void|delete|yield)\b/g
  const strings = /(["'`])(?:(?!\1)[^\\]|\\.)*\1/g
  const comments = /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm
  const numbers = /\b(\d+\.?\d*)\b/g
  const funcs = /\b([a-zA-Z_]\w*)\s*\(/g
  
  // tokenize to avoid overlapping
  const tokens: { start: number, end: number, style: (s: string) => string }[] = []
  
  let m
  while ((m = comments.exec(code)) !== null) {
    tokens.push({ start: m.index, end: m.index + m[0].length, style: ansi.grey })
  }
  while ((m = strings.exec(code)) !== null) {
    tokens.push({ start: m.index, end: m.index + m[0].length, style: ansi.green })
  }
  
  // sort by start position
  tokens.sort((a, b) => a.start - b.start)
  
  // apply non-overlapping tokens first
  let result = ''
  let pos = 0
  
  for (const t of tokens) {
    if (t.start < pos) continue
    result += applyInlineStyles(code.slice(pos, t.start), keywords, numbers, funcs)
    result += t.style(code.slice(t.start, t.end))
    pos = t.end
  }
  result += applyInlineStyles(code.slice(pos), keywords, numbers, funcs)
  
  return result
}

function applyInlineStyles(text: string, keywords: RegExp, numbers: RegExp, funcs: RegExp): string {
  return text
    .replace(funcs, (match, name) => ansi.blue(name) + '(')
    .replace(keywords, ansi.magenta('$1'))
    .replace(numbers, ansi.yellow('$1'))
}

function highlightGo(code: string): string {
  const keywords = /\b(package|import|func|return|if|else|for|range|switch|case|break|continue|go|defer|select|chan|map|struct|interface|type|const|var|nil|true|false|make|new|len|cap|append|copy|delete|panic|recover)\b/g
  const strings = /(["'`])(?:(?!\1)[^\\]|\\.)*\1/g
  const comments = /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm
  const numbers = /\b(\d+\.?\d*)\b/g
  
  const tokens: { start: number, end: number, style: (s: string) => string }[] = []
  
  let m
  while ((m = comments.exec(code)) !== null) {
    tokens.push({ start: m.index, end: m.index + m[0].length, style: ansi.grey })
  }
  while ((m = strings.exec(code)) !== null) {
    tokens.push({ start: m.index, end: m.index + m[0].length, style: ansi.green })
  }
  
  tokens.sort((a, b) => a.start - b.start)
  
  let result = ''
  let pos = 0
  
  for (const t of tokens) {
    if (t.start < pos) continue
    result += code.slice(pos, t.start)
      .replace(keywords, ansi.magenta('$1'))
      .replace(numbers, ansi.yellow('$1'))
    result += t.style(code.slice(t.start, t.end))
    pos = t.end
  }
  result += code.slice(pos)
    .replace(keywords, ansi.magenta('$1'))
    .replace(numbers, ansi.yellow('$1'))
  
  return result
}

function highlightPython(code: string): string {
  const keywords = /\b(def|class|return|if|elif|else|for|while|break|continue|import|from|as|try|except|finally|raise|with|lambda|yield|global|nonlocal|pass|None|True|False|and|or|not|in|is)\b/g
  const strings = /("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g
  const comments = /(#.*$)/gm
  const numbers = /\b(\d+\.?\d*)\b/g
  
  const tokens: { start: number, end: number, style: (s: string) => string }[] = []
  
  let m
  while ((m = comments.exec(code)) !== null) {
    tokens.push({ start: m.index, end: m.index + m[0].length, style: ansi.grey })
  }
  while ((m = strings.exec(code)) !== null) {
    tokens.push({ start: m.index, end: m.index + m[0].length, style: ansi.green })
  }
  
  tokens.sort((a, b) => a.start - b.start)
  
  let result = ''
  let pos = 0
  
  for (const t of tokens) {
    if (t.start < pos) continue
    result += code.slice(pos, t.start)
      .replace(keywords, ansi.magenta('$1'))
      .replace(numbers, ansi.yellow('$1'))
    result += t.style(code.slice(t.start, t.end))
    pos = t.end
  }
  result += code.slice(pos)
    .replace(keywords, ansi.magenta('$1'))
    .replace(numbers, ansi.yellow('$1'))
  
  return result
}

function highlightBash(code: string): string {
  const keywords = /\b(if|then|else|elif|fi|for|while|do|done|case|esac|function|return|exit|echo|cd|ls|rm|cp|mv|mkdir|cat|grep|sed|awk|export|source|local)\b/g
  const strings = /("(?:[^"\\]|\\.)*"|'[^']*')/g
  const comments = /(#.*$)/gm
  const vars = /(\$\{?[a-zA-Z_]\w*\}?)/g
  
  return code
    .replace(comments, ansi.grey('$1'))
    .replace(strings, ansi.green('$1'))
    .replace(vars, ansi.cyan('$1'))
    .replace(keywords, ansi.magenta('$1'))
}

function highlightJSON(code: string): string {
  const keys = /("(?:[^"\\]|\\.)*")\s*:/g
  const strings = /:\s*("(?:[^"\\]|\\.)*")/g
  const numbers = /:\s*(\d+\.?\d*)/g
  const bools = /\b(true|false|null)\b/g
  
  return code
    .replace(keys, ansi.cyan('$1') + ':')
    .replace(strings, ': ' + ansi.green('$1'))
    .replace(numbers, ': ' + ansi.yellow('$1'))
    .replace(bools, ansi.magenta('$1'))
}

function highlightYAML(code: string): string {
  const keys = /^(\s*[a-zA-Z_-][a-zA-Z0-9_-]*):/gm
  const strings = /:\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g
  const comments = /(#.*$)/gm
  const bools = /\b(true|false|null|yes|no)\b/gi
  
  return code
    .replace(comments, ansi.grey('$1'))
    .replace(keys, ansi.cyan('$1') + ':')
    .replace(strings, ': ' + ansi.green('$1'))
    .replace(bools, ansi.magenta('$1'))
}

function highlightHTML(code: string): string {
  const comments = /(<!--[\s\S]*?-->)/g
  const tags = /(<\/?[a-zA-Z][a-zA-Z0-9]*)/g
  const attrs = /(\s[a-zA-Z-]+)=/g
  const strings = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g
  
  return code
    .replace(comments, ansi.grey('$1'))
    .replace(tags, ansi.blue('$1'))
    .replace(attrs, ansi.cyan('$1') + '=')
    .replace(strings, ansi.green('$1'))
}

function highlightCSS(code: string): string {
  const comments = /(\/\*[\s\S]*?\*\/)/g
  const selectors = /([.#]?[a-zA-Z_-][a-zA-Z0-9_-]*)\s*\{/g
  const props = /([a-zA-Z-]+)\s*:/g
  const values = /(#[0-9a-fA-F]{3,8}|\d+\.?\d*(px|em|rem|%|vh|vw)?)/g
  
  return code
    .replace(comments, ansi.grey('$1'))
    .replace(selectors, ansi.blue('$1') + ' {')
    .replace(props, ansi.cyan('$1') + ':')
    .replace(values, ansi.yellow('$1'))
}
