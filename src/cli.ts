#!/usr/bin/env node

import { markdown } from './index'
import { readFileSync } from 'fs'

const VERSION = '1.0.0'

const HELP = `
Usage: md [options] [file]

Render Markdown to terminal with syntax highlighting.

Options:
  -h, --help     Show this help message
  -v, --version  Show version number

Examples:
  md README.md           Render a file
  cat README.md | md     Render from stdin
  echo "# Hello" | md    Render inline markdown
`.trim()

async function main() {
  const args = process.argv.slice(2)
  
  if (args.includes('-h') || args.includes('--help')) {
    console.log(HELP)
    return
  }
  
  if (args.includes('-v') || args.includes('--version')) {
    console.log(VERSION)
    return
  }
  
  const files = args.filter(a => !a.startsWith('-'))
  
  let input: string
  
  if (files.length > 0) {
    try {
      input = readFileSync(files[0], 'utf-8')
    } catch {
      console.error(`File not found: ${files[0]}`)
      process.exit(1)
    }
  } else {
    const chunks: Buffer[] = []
    for await (const chunk of process.stdin) {
      chunks.push(Buffer.from(chunk))
    }
    input = Buffer.concat(chunks).toString('utf-8')
  }
  
  process.stdout.write(markdown(input))
}

main().catch(err => {
  console.error(err.message || err)
  process.exit(1)
})
