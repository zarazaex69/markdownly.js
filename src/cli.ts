#!/usr/bin/env node

import { markdown } from './index'
import { readFileSync } from 'fs'

async function main() {
  const args = process.argv.slice(2)
  
  let input: string
  
  if (args.length > 0) {
    try {
      input = readFileSync(args[0], 'utf-8')
    } catch {
      console.error(`File not found: ${args[0]}`)
      process.exit(1)
    }
  } else {
    // read from stdin
    const chunks: Buffer[] = []
    for await (const chunk of process.stdin) {
      chunks.push(Buffer.from(chunk))
    }
    input = Buffer.concat(chunks).toString('utf-8')
  }
  
  process.stdout.write(markdown(input))
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
