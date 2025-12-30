import { parse } from './parser'
import { render } from './renderer'

export function markdown(input: string): string {
  const tokens = parse(input)
  return render(tokens)
}

export default markdown
export { parse } from './parser'
export { render } from './renderer'
