<div align="center">

![Bun](https://img.shields.io/badge/-Bun-0D1117?style=flat-square&logo=Bun&logoColor=F3E6D8)
![TypeScript](https://img.shields.io/badge/-TypeScript-0D1117?style=flat-square&logo=typescript&logoColor=3178C6)
![License](https://img.shields.io/badge/license-BSD--2--Clause-0D1117?style=flat-square&logo=open-source-initiative&logoColor=green&labelColor=0D1117)

# markdownly.js

Render Markdown to Terminal — Zero Dependencies

</div>

## About

Fast and lightweight Markdown renderer for the terminal. Built with Bun/TypeScript, zero external dependencies.

Supports:
- Headers (h1-h6)
- Bold, italic, strikethrough
- Code blocks with syntax highlighting
- Inline code
- Blockquotes
- GitHub-style alerts (NOTE, TIP, WARNING, etc.)
- Tables
- Lists (ordered, unordered, checkboxes)
- Links and images
- Horizontal rules

## Fast Start

```bash
# bun
bun add markdownly.js

# npm
npm install markdownly.js
```

## CLI Usage

```bash
# render file
md README.md

# pipe from stdin
cat README.md | md

# or use full name
markdown docs/guide.md
```

## API Usage

```typescript
import { markdown } from "markdownly.js"

const output = markdown(`
# Hello World

This is **bold** and *italic* text.

\`\`\`js
const x = 42
console.log(x)
\`\`\`
`)

console.log(output)
```

### Functions

#### `markdown(input: string): string`

Main function. Parses markdown and returns ANSI-styled string for terminal output.

```typescript
import { markdown } from "markdownly.js"

console.log(markdown("# Title"))
```

#### `parse(input: string): Token[]`

Low-level parser. Returns array of tokens.

```typescript
import { parse } from "markdownly.js"

const tokens = parse("# Hello")
// [{ type: 'h1', content: 'Hello', children: [...] }]
```

#### `render(tokens: Token[]): string`

Low-level renderer. Converts tokens to ANSI string.

```typescript
import { parse, render } from "markdownly.js"

const tokens = parse("**bold**")
const output = render(tokens)
```

## Supported Syntax

### Headers

```markdown
# H1
## H2
### H3
#### H4
##### H5
###### H6
```

### Text Formatting

```markdown
**bold**
*italic*
~~strikethrough~~
`inline code`
==marked==
++inserted++
```

### Code Blocks

````markdown
```js
const x = 42
```
````

Supported languages: JavaScript, TypeScript, Go, Python, Bash, HTML, CSS, JSON, YAML

### Lists

```markdown
- Item 1
- Item 2
  - Nested

1. First
2. Second

- [ ] Todo
- [x] Done
```

### Blockquotes

```markdown
> Quote text
> More text
```

### Alerts (GitHub style)

```markdown
> [!NOTE]
> Information

> [!TIP]
> Helpful tip

> [!WARNING]
> Be careful

> [!IMPORTANT]
> Critical info

> [!CAUTION]
> Danger zone
```

### Tables

```markdown
| Name | Value |
|------|-------|
| foo  | 42    |
| bar  | 13    |
```

### Links & Images

```markdown
[Link text](https://example.com)
![Alt text](image.png)
```

## Development

```bash
# clone
git clone https://github.com/zarazaex69/markdownly.js.git
cd markdownly.js

# run
bun run src/cli.ts example/index.md

# build
bun run build
```

<div align="center">

---

### Contact

Telegram: [zarazaex](https://t.me/zarazaexe)<br>
Email: [zarazaex@tuta.io](mailto:zarazaex@tuta.io)<br>
Site: [zarazaex.xyz](https://zarazaex.xyz)

</div>
