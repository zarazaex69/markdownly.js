import { describe, test, expect } from 'bun:test'
import * as ansi from '../src/ansi'

describe('ANSI utilities', () => {
  describe('Color functions', () => {
    test('applies basic colors', () => {
      const text = 'test'
      
      expect(ansi.red(text)).toContain('\x1b[31m')
      expect(ansi.green(text)).toContain('\x1b[32m')
      expect(ansi.blue(text)).toContain('\x1b[34m')
      expect(ansi.yellow(text)).toContain('\x1b[33m')
    })

    test('applies bright colors', () => {
      const text = 'test'
      
      expect(ansi.redBright(text)).toContain('\x1b[91m')
      expect(ansi.greenBright(text)).toContain('\x1b[92m')
      expect(ansi.blueBright(text)).toContain('\x1b[94m')
    })

    test('applies background colors', () => {
      const text = 'test'
      
      expect(ansi.bgRed(text)).toContain('\x1b[41m')
      expect(ansi.bgGreen(text)).toContain('\x1b[42m')
      expect(ansi.bgBlue(text)).toContain('\x1b[44m')
    })
  })

  describe('Style functions', () => {
    test('applies text styles', () => {
      const text = 'test'
      
      expect(ansi.bold(text)).toContain('\x1b[1m')
      expect(ansi.italic(text)).toContain('\x1b[3m')
      expect(ansi.underline(text)).toContain('\x1b[4m')
      expect(ansi.strikethrough(text)).toContain('\x1b[9m')
      expect(ansi.dim(text)).toContain('\x1b[2m')
    })

    test('includes reset codes', () => {
      expect(ansi.bold('test')).toContain('\x1b[22m')
      expect(ansi.red('test')).toContain('\x1b[39m')
      expect(ansi.bgRed('test')).toContain('\x1b[49m')
    })
  })

  describe('Compose function', () => {
    test('combines multiple styles', () => {
      const styled = ansi.compose(ansi.red, ansi.bold)('test')
      
      expect(styled).toContain('\x1b[31m')
      expect(styled).toContain('\x1b[1m')
    })

    test('handles empty function list', () => {
      const styled = ansi.compose()('test')
      
      expect(styled).toBe('test')
    })

    test('filters out falsy functions', () => {
      const styled = ansi.compose(ansi.red, null as any, ansi.bold)('test')
      
      expect(styled).toContain('\x1b[31m')
      expect(styled).toContain('\x1b[1m')
    })
  })

  describe('stripAnsi function', () => {
    test('removes ANSI escape codes', () => {
      const styledText = ansi.red('hello')
      const stripped = ansi.stripAnsi(styledText)
      
      expect(stripped).toBe('hello')
      expect(stripped).not.toContain('\x1b[')
    })

    test('handles text without ANSI codes', () => {
      const plainText = 'hello world'
      const stripped = ansi.stripAnsi(plainText)
      
      expect(stripped).toBe(plainText)
    })

    test('handles complex ANSI sequences', () => {
      const complexText = '\x1b[31;1mred bold\x1b[0m normal \x1b[32mgreen\x1b[39m'
      const stripped = ansi.stripAnsi(complexText)
      
      expect(stripped).toBe('red bold normal green')
    })
  })

  describe('visibleLength function', () => {
    test('calculates length without ANSI codes', () => {
      const styledText = ansi.red('hello')
      const length = ansi.visibleLength(styledText)
      
      expect(length).toBe(5)
    })

    test('handles plain text', () => {
      const plainText = 'hello world'
      const length = ansi.visibleLength(plainText)
      
      expect(length).toBe(11)
    })

    test('handles empty string', () => {
      const length = ansi.visibleLength('')
      
      expect(length).toBe(0)
    })

    test('handles multiple styled segments', () => {
      const text = ansi.red('red') + ' ' + ansi.blue('blue')
      const length = ansi.visibleLength(text)
      
      expect(length).toBe(8)
    })
  })

  describe('getTerminalWidth function', () => {
    test('returns a number', () => {
      const width = ansi.getTerminalWidth()
      
      expect(typeof width).toBe('number')
      expect(width).toBeGreaterThan(0)
    })

    test('has reasonable default', () => {
      const width = ansi.getTerminalWidth()
      
      expect(width).toBeGreaterThanOrEqual(80)
    })
  })

  describe('Color detection', () => {
    test('respects FORCE_COLOR=1', () => {
      const originalForceColor = process.env.FORCE_COLOR
      process.env.FORCE_COLOR = '1'
      
      const styled = ansi.red('test')
      expect(styled).toContain('\x1b[31m')
      
      process.env.FORCE_COLOR = originalForceColor
    })

    test('respects NO_COLOR', () => {
      const originalNoColor = process.env.NO_COLOR
      const originalForceColor = process.env.FORCE_COLOR
      
      process.env.NO_COLOR = '1'
      delete process.env.FORCE_COLOR
      
      const styled = ansi.red('test')
      expect(styled).toBe('test')
      
      if (originalNoColor) {
        process.env.NO_COLOR = originalNoColor
      } else {
        delete process.env.NO_COLOR
      }
      if (originalForceColor) {
        process.env.FORCE_COLOR = originalForceColor
      }
    })
  })
})