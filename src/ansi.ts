const ESC = '\x1b['
const RESET = `${ESC}0m`

type StyleFn = (s: string) => string

const wrap = (open: string, close: string): StyleFn => 
  (s: string) => `${ESC}${open}m${s}${ESC}${close}m`

// basic colors
export const red = wrap('31', '39')
export const green = wrap('32', '39')
export const yellow = wrap('33', '39')
export const blue = wrap('34', '39')
export const magenta = wrap('35', '39')
export const cyan = wrap('36', '39')
export const grey = wrap('90', '39')
export const white = wrap('37', '39')
export const black = wrap('30', '39')

// bright colors
export const redBright = wrap('91', '39')
export const greenBright = wrap('92', '39')
export const yellowBright = wrap('93', '39')
export const blueBright = wrap('94', '39')
export const magentaBright = wrap('95', '39')
export const cyanBright = wrap('96', '39')

// background colors
export const bgBlack = wrap('40', '49')
export const bgRed = wrap('41', '49')
export const bgGreen = wrap('42', '49')
export const bgYellow = wrap('43', '49')
export const bgBlue = wrap('44', '49')
export const bgMagenta = wrap('45', '49')
export const bgCyan = wrap('46', '49')
export const bgWhite = wrap('47', '49')

// styles
export const bold = wrap('1', '22')
export const dim = wrap('2', '22')
export const italic = wrap('3', '23')
export const underline = wrap('4', '24')
export const strikethrough = wrap('9', '29')

export const compose = (...fns: StyleFn[]): StyleFn => 
  (s: string) => fns.filter(Boolean).reduce((acc, fn) => fn(acc), s)

export const getTerminalWidth = (): number => {
  try {
    return process.stdout.columns || 80
  } catch {
    return 80
  }
}
