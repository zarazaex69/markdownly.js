import * as ansi from './ansi'

type Token = { start: number, end: number, style: (s: string) => string }

function tokenize(code: string, patterns: { regex: RegExp, style: (s: string) => string }[]): Token[] {
  const tokens: Token[] = []
  for (const { regex, style } of patterns) {
    regex.lastIndex = 0
    let m
    while ((m = regex.exec(code)) !== null) {
      tokens.push({ start: m.index, end: m.index + m[0].length, style })
    }
  }
  return tokens.sort((a, b) => a.start - b.start)
}

function applyTokens(code: string, tokens: Token[], inlineReplace?: (s: string) => string): string {
  let result = ''
  let pos = 0
  for (const t of tokens) {
    if (t.start < pos) continue
    const chunk = code.slice(pos, t.start)
    result += inlineReplace ? inlineReplace(chunk) : chunk
    result += t.style(code.slice(t.start, t.end))
    pos = t.end
  }
  const rest = code.slice(pos)
  result += inlineReplace ? inlineReplace(rest) : rest
  return result
}

export function highlight(code: string, lang: string): string {
  const l = lang.toLowerCase()
  const highlighters: Record<string, (c: string) => string> = {
    js: highlightJS, javascript: highlightJS, ts: highlightJS, typescript: highlightJS,
    jsx: highlightJS, tsx: highlightJS, mjs: highlightJS, cjs: highlightJS,
    go: highlightGo, golang: highlightGo,
    py: highlightPython, python: highlightPython,
    sh: highlightBash, bash: highlightBash, shell: highlightBash, zsh: highlightBash,
    json: highlightJSON, jsonc: highlightJSON,
    yaml: highlightYAML, yml: highlightYAML,
    html: highlightHTML, xml: highlightHTML, svg: highlightHTML,
    css: highlightCSS, scss: highlightCSS, less: highlightCSS,
    rust: highlightRust, rs: highlightRust,
    c: highlightC, cpp: highlightC, 'c++': highlightC, h: highlightC, hpp: highlightC,
    java: highlightJava, kt: highlightKotlin, kotlin: highlightKotlin,
    rb: highlightRuby, ruby: highlightRuby,
    sql: highlightSQL,
    dockerfile: highlightDockerfile, docker: highlightDockerfile,
    md: highlightMarkdown, markdown: highlightMarkdown,
    php: highlightPHP,
    swift: highlightSwift,
    lua: highlightLua,
    r: highlightR,
    perl: highlightPerl, pl: highlightPerl,
    scala: highlightScala,
    hs: highlightHaskell, haskell: highlightHaskell,
    ex: highlightElixir, exs: highlightElixir, elixir: highlightElixir,
    clj: highlightClojure, clojure: highlightClojure,
    zig: highlightZig,
    nim: highlightNim,
    diff: highlightDiff, patch: highlightDiff,
    toml: highlightTOML,
    ini: highlightINI, conf: highlightINI,
    makefile: highlightMakefile, make: highlightMakefile,
    graphql: highlightGraphQL, gql: highlightGraphQL,
    proto: highlightProto, protobuf: highlightProto,
    terraform: highlightTerraform, tf: highlightTerraform, hcl: highlightTerraform,
    vue: highlightHTML, svelte: highlightHTML,
    fish: highlightBash,
    crystal: highlightRuby, cr: highlightRuby,
    apex: highlightJava, soql: highlightSQL,
 
  }
  return (highlighters[l] || ((c: string) => ansi.yellowBright(c)))(code)
}

function highlightJS(code: string): string {
  const tokens = tokenize(code, [
    { regex: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm, style: ansi.grey },
    { regex: /(["'`])(?:(?!\1)[^\\]|\\.)*\1/g, style: ansi.green },
    { regex: /\/(?![*\/])(?:\\.|\[(?:\\.|[^\]])*\]|[^\/\n])+\/[gimsuy]*/g, style: ansi.yellow },
  ])
  const kw = /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|this|class|extends|import|export|from|default|async|await|try|catch|finally|throw|typeof|instanceof|in|of|null|undefined|true|false|void|delete|yield|static|get|set|super|implements|interface|type|enum|namespace|declare|abstract|private|protected|public|readonly|as|satisfies|keyof|infer|never|unknown|any)\b/g
  const nums = /\b(0x[0-9a-fA-F]+|0b[01]+|0o[0-7]+|\d+\.?\d*(?:e[+-]?\d+)?n?)\b/g
  const funcs = /\b([a-zA-Z_$][\w$]*)\s*(?=\()/g
  return applyTokens(code, tokens, s => s
    .replace(funcs, m => ansi.blue(m.slice(0, -1)) + '(')
    .replace(kw, ansi.magenta('$1'))
    .replace(nums, ansi.yellow('$1')))
}

function highlightGo(code: string): string {
  const tokens = tokenize(code, [
    { regex: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm, style: ansi.grey },
    { regex: /(["'`])(?:(?!\1)[^\\]|\\.)*\1/g, style: ansi.green },
  ])
  const kw = /\b(package|import|func|return|if|else|for|range|switch|case|break|continue|go|defer|select|chan|map|struct|interface|type|const|var|nil|true|false|make|new|len|cap|append|copy|delete|panic|recover|fallthrough|goto|default)\b/g
  const types = /\b(int|int8|int16|int32|int64|uint|uint8|uint16|uint32|uint64|float32|float64|complex64|complex128|byte|rune|string|bool|error|any|comparable)\b/g
  const nums = /\b(0x[0-9a-fA-F]+|0b[01]+|0o[0-7]+|\d+\.?\d*(?:e[+-]?\d+)?i?)\b/g
  return applyTokens(code, tokens, s => s
    .replace(kw, ansi.magenta('$1'))
    .replace(types, ansi.cyan('$1'))
    .replace(nums, ansi.yellow('$1')))
}

function highlightPython(code: string): string {
  const tokens = tokenize(code, [
    { regex: /(#.*$)/gm, style: ansi.grey },
    { regex: /("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, style: ansi.green },
    { regex: /\b(f|r|b|fr|rf|br|rb)(?=["'])/gi, style: ansi.cyan },
  ])
  const kw = /\b(def|class|return|if|elif|else|for|while|break|continue|import|from|as|try|except|finally|raise|with|lambda|yield|global|nonlocal|pass|None|True|False|and|or|not|in|is|async|await|assert|del|match|case)\b/g
  const builtins = /\b(print|len|range|str|int|float|list|dict|set|tuple|bool|type|isinstance|hasattr|getattr|setattr|open|input|map|filter|zip|enumerate|sorted|reversed|sum|min|max|abs|round|all|any|iter|next|super|property|staticmethod|classmethod)\b/g
  const nums = /\b(0x[0-9a-fA-F]+|0b[01]+|0o[0-7]+|\d+\.?\d*(?:e[+-]?\d+)?j?)\b/g
  const decorators = /(@[\w.]+)/g
  return applyTokens(code, tokens, s => s
    .replace(decorators, ansi.yellow('$1'))
    .replace(kw, ansi.magenta('$1'))
    .replace(builtins, ansi.cyan('$1'))
    .replace(nums, ansi.yellow('$1')))
}

function highlightBash(code: string): string {
  const tokens = tokenize(code, [
    { regex: /(#.*$)/gm, style: ansi.grey },
    { regex: /("(?:[^"\\]|\\.)*"|'[^']*')/g, style: ansi.green },
  ])
  const kw = /\b(if|then|else|elif|fi|for|while|do|done|case|esac|function|return|exit|echo|cd|ls|rm|cp|mv|mkdir|cat|grep|sed|awk|export|source|local|in|select|until|shift|trap|set|unset|readonly|declare|typeset|alias|unalias|eval|exec|test|read|printf|true|false)\b/g
  const vars = /(\$\{?[a-zA-Z_]\w*\}?|\$[0-9@#?$!*-])/g
  const ops = /([|&;><]|\|\||&&|>>|<<|2>&1)/g
  return applyTokens(code, tokens, s => s
    .replace(vars, ansi.cyan('$1'))
    .replace(kw, ansi.magenta('$1'))
    .replace(ops, ansi.red('$1')))
}

function highlightJSON(code: string): string {
  return code
    .replace(/("(?:[^"\\]|\\.)*")\s*:/g, ansi.cyan('$1') + ':')
    .replace(/:\s*("(?:[^"\\]|\\.)*")/g, ': ' + ansi.green('$1'))
    .replace(/:\s*(-?\d+\.?\d*(?:e[+-]?\d+)?)/gi, ': ' + ansi.yellow('$1'))
    .replace(/\b(true|false|null)\b/g, ansi.magenta('$1'))
}

function highlightYAML(code: string): string {
  const tokens = tokenize(code, [
    { regex: /(#.*$)/gm, style: ansi.grey },
    { regex: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, style: ansi.green },
  ])
  const keys = /^(\s*[a-zA-Z_-][a-zA-Z0-9_-]*):/gm
  const anchors = /(&\w+|\*\w+)/g
  const bools = /\b(true|false|null|yes|no|on|off|~)\b/gi
  return applyTokens(code, tokens, s => s
    .replace(keys, ansi.cyan('$1') + ':')
    .replace(anchors, ansi.yellow('$1'))
    .replace(bools, ansi.magenta('$1')))
}

function highlightHTML(code: string): string {
  const tokens = tokenize(code, [
    { regex: /(<!--[\s\S]*?-->)/g, style: ansi.grey },
    { regex: /(<!\[CDATA\[[\s\S]*?\]\]>)/g, style: ansi.grey },
  ])
  const tags = /(<\/?[a-zA-Z][a-zA-Z0-9:-]*|\/?>)/g
  const attrs = /(\s[a-zA-Z:_][\w:.-]*)(?==)/g
  const strings = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g
  const entities = /(&[a-zA-Z0-9#]+;)/g
  return applyTokens(code, tokens, s => s
    .replace(tags, ansi.blue('$1'))
    .replace(attrs, ansi.cyan('$1'))
    .replace(strings, ansi.green('$1'))
    .replace(entities, ansi.yellow('$1')))
}

function highlightCSS(code: string): string {
  const tokens = tokenize(code, [
    { regex: /(\/\*[\s\S]*?\*\/)/g, style: ansi.grey },
  ])
  const selectors = /([.#@]?[a-zA-Z_-][a-zA-Z0-9_-]*(?:\s*[,>+~]\s*[.#@]?[a-zA-Z_-][a-zA-Z0-9_-]*)*)\s*\{/g
  const props = /([a-zA-Z-]+)\s*:/g
  const values = /(#[0-9a-fA-F]{3,8}|\d+\.?\d*(px|em|rem|%|vh|vw|vmin|vmax|ch|ex|deg|rad|turn|s|ms)?)/g
  const funcs = /\b(url|rgb|rgba|hsl|hsla|calc|var|min|max|clamp|linear-gradient|radial-gradient)\s*\(/g
  const vars = /(--[a-zA-Z-]+)/g
  return applyTokens(code, tokens, s => s
    .replace(selectors, ansi.blue('$1') + ' {')
    .replace(props, ansi.cyan('$1') + ':')
    .replace(funcs, ansi.magenta('$1') + '(')
    .replace(vars, ansi.yellow('$1'))
    .replace(values, ansi.yellow('$1')))
}

function highlightRust(code: string): string {
  const tokens = tokenize(code, [
    { regex: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm, style: ansi.grey },
    { regex: /(r#*"[\s\S]*?"#*|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, style: ansi.green },
  ])
  const kw = /\b(fn|let|mut|const|static|if|else|match|loop|while|for|in|break|continue|return|struct|enum|impl|trait|type|where|pub|mod|use|crate|self|Self|super|as|async|await|dyn|move|ref|unsafe|extern|macro_rules)\b/g
  const types = /\b(i8|i16|i32|i64|i128|isize|u8|u16|u32|u64|u128|usize|f32|f64|bool|char|str|String|Vec|Option|Result|Box|Rc|Arc|Cell|RefCell|HashMap|HashSet|BTreeMap|BTreeSet)\b/g
  const macros = /\b([a-zA-Z_]\w*!)/g
  const lifetimes = /('[a-zA-Z_]\w*)/g
  const attrs = /(#!?\[[^\]]+\])/g
  const nums = /\b(0x[0-9a-fA-F_]+|0b[01_]+|0o[0-7_]+|\d[\d_]*\.?[\d_]*(?:e[+-]?[\d_]+)?(?:i8|i16|i32|i64|i128|isize|u8|u16|u32|u64|u128|usize|f32|f64)?)\b/g
  return applyTokens(code, tokens, s => s
    .replace(attrs, ansi.yellow('$1'))
    .replace(macros, ansi.cyan('$1'))
    .replace(lifetimes, ansi.yellow('$1'))
    .replace(kw, ansi.magenta('$1'))
    .replace(types, ansi.cyan('$1'))
    .replace(nums, ansi.yellow('$1')))
}

function highlightC(code: string): string {
  const tokens = tokenize(code, [
    { regex: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm, style: ansi.grey },
    { regex: /(L?"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, style: ansi.green },
    { regex: /^(\s*#\s*\w+.*$)/gm, style: ansi.cyan },
  ])
  const kw = /\b(auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|inline|int|long|register|restrict|return|short|signed|sizeof|static|struct|switch|typedef|union|unsigned|void|volatile|while|_Alignas|_Alignof|_Atomic|_Bool|_Complex|_Generic|_Imaginary|_Noreturn|_Static_assert|_Thread_local|class|public|private|protected|virtual|override|final|template|typename|namespace|using|new|delete|this|throw|try|catch|nullptr|constexpr|decltype|noexcept|static_cast|dynamic_cast|reinterpret_cast|const_cast|explicit|friend|mutable|operator)\b/g
  const types = /\b(int8_t|int16_t|int32_t|int64_t|uint8_t|uint16_t|uint32_t|uint64_t|size_t|ptrdiff_t|intptr_t|uintptr_t|bool|true|false|NULL|nullptr|std|string|vector|map|set|array|unique_ptr|shared_ptr|weak_ptr)\b/g
  const nums = /\b(0x[0-9a-fA-F]+[uUlL]*|0b[01]+[uUlL]*|0[0-7]+[uUlL]*|\d+\.?\d*(?:e[+-]?\d+)?[fFlLuU]*)\b/g
  return applyTokens(code, tokens, s => s
    .replace(kw, ansi.magenta('$1'))
    .replace(types, ansi.cyan('$1'))
    .replace(nums, ansi.yellow('$1')))
}

function highlightJava(code: string): string {
  const tokens = tokenize(code, [
    { regex: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm, style: ansi.grey },
    { regex: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, style: ansi.green },
  ])
  const kw = /\b(abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|extends|final|finally|float|for|goto|if|implements|import|instanceof|int|interface|long|native|new|package|private|protected|public|return|short|static|strictfp|super|switch|synchronized|this|throw|throws|transient|try|void|volatile|while|var|record|sealed|permits|non-sealed|yield)\b/g
  const types = /\b(String|Integer|Long|Double|Float|Boolean|Character|Byte|Short|Object|Class|List|Map|Set|ArrayList|HashMap|HashSet|Optional|Stream|Collectors|Arrays|Collections|System|Math|Thread|Runnable|Callable|Future|CompletableFuture)\b/g
  const annotations = /(@\w+)/g
  const nums = /\b(0x[0-9a-fA-F_]+[lL]?|0b[01_]+[lL]?|\d[\d_]*\.?[\d_]*(?:e[+-]?[\d_]+)?[fFdDlL]?)\b/g
  return applyTokens(code, tokens, s => s
    .replace(annotations, ansi.yellow('$1'))
    .replace(kw, ansi.magenta('$1'))
    .replace(types, ansi.cyan('$1'))
    .replace(nums, ansi.yellow('$1')))
}

function highlightKotlin(code: string): string {
  const tokens = tokenize(code, [
    { regex: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm, style: ansi.grey },
    { regex: /("""[\s\S]*?"""|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, style: ansi.green },
  ])
  const kw = /\b(abstract|actual|annotation|as|break|by|catch|class|companion|const|constructor|continue|crossinline|data|delegate|do|dynamic|else|enum|expect|external|false|final|finally|for|fun|get|if|import|in|infix|init|inline|inner|interface|internal|is|lateinit|noinline|null|object|open|operator|out|override|package|private|protected|public|reified|return|sealed|set|super|suspend|tailrec|this|throw|true|try|typealias|typeof|val|var|vararg|when|where|while)\b/g
  const types = /\b(Any|Boolean|Byte|Char|Double|Float|Int|Long|Nothing|Short|String|Unit|Array|List|Map|Set|MutableList|MutableMap|MutableSet|Pair|Triple|Sequence)\b/g
  const annotations = /(@\w+)/g
  const nums = /\b(0x[0-9a-fA-F_]+[uUlL]*|0b[01_]+[uUlL]*|\d[\d_]*\.?[\d_]*(?:e[+-]?[\d_]+)?[fFuUlL]*)\b/g
  return applyTokens(code, tokens, s => s
    .replace(annotations, ansi.yellow('$1'))
    .replace(kw, ansi.magenta('$1'))
    .replace(types, ansi.cyan('$1'))
    .replace(nums, ansi.yellow('$1')))
}

function highlightRuby(code: string): string {
  const tokens = tokenize(code, [
    { regex: /(#.*$)/gm, style: ansi.grey },
    { regex: /("""[\s\S]*?"""|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, style: ansi.green },
    { regex: /(\/(?![*\/])(?:\\.|\[(?:\\.|[^\]])*\]|[^\/\n])+\/[imxo]*)/g, style: ansi.yellow },
  ])
  const kw = /\b(alias|and|begin|break|case|class|def|defined\?|do|else|elsif|end|ensure|false|for|if|in|module|next|nil|not|or|redo|rescue|retry|return|self|super|then|true|undef|unless|until|when|while|yield|__FILE__|__LINE__|__ENCODING__|attr_reader|attr_writer|attr_accessor|private|protected|public|require|require_relative|include|extend|prepend|raise|lambda|proc)\b/g
  const symbols = /(:[a-zA-Z_]\w*[?!]?)/g
  const vars = /(@{1,2}[a-zA-Z_]\w*|\$[a-zA-Z_]\w*)/g
  const nums = /\b(0x[0-9a-fA-F_]+|0b[01_]+|0o[0-7_]+|\d[\d_]*\.?[\d_]*(?:e[+-]?[\d_]+)?i?)\b/g
  return applyTokens(code, tokens, s => s
    .replace(symbols, ansi.cyan('$1'))
    .replace(vars, ansi.blue('$1'))
    .replace(kw, ansi.magenta('$1'))
    .replace(nums, ansi.yellow('$1')))
}

function highlightSQL(code: string): string {
  const tokens = tokenize(code, [
    { regex: /(--.*$|\/\*[\s\S]*?\*\/)/gm, style: ansi.grey },
    { regex: /('(?:[^'\\]|\\.)*')/g, style: ansi.green },
  ])
  const kw = /\b(SELECT|FROM|WHERE|AND|OR|NOT|IN|IS|NULL|AS|ON|JOIN|LEFT|RIGHT|INNER|OUTER|FULL|CROSS|NATURAL|USING|ORDER|BY|ASC|DESC|LIMIT|OFFSET|GROUP|HAVING|UNION|ALL|DISTINCT|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|INDEX|VIEW|DATABASE|SCHEMA|ALTER|DROP|TRUNCATE|ADD|COLUMN|CONSTRAINT|PRIMARY|KEY|FOREIGN|REFERENCES|UNIQUE|CHECK|DEFAULT|AUTO_INCREMENT|SERIAL|CASCADE|RESTRICT|IF|EXISTS|CASE|WHEN|THEN|ELSE|END|BETWEEN|LIKE|ILIKE|SIMILAR|TO|ESCAPE|CAST|COALESCE|NULLIF|GREATEST|LEAST|COUNT|SUM|AVG|MIN|MAX|OVER|PARTITION|ROW_NUMBER|RANK|DENSE_RANK|LEAD|LAG|FIRST_VALUE|LAST_VALUE|WITH|RECURSIVE|RETURNING|EXPLAIN|ANALYZE|VACUUM|GRANT|REVOKE|COMMIT|ROLLBACK|SAVEPOINT|BEGIN|TRANSACTION|LOCK|UNLOCK)\b/gi
  const types = /\b(INT|INTEGER|SMALLINT|BIGINT|DECIMAL|NUMERIC|FLOAT|REAL|DOUBLE|PRECISION|CHAR|VARCHAR|TEXT|BLOB|CLOB|DATE|TIME|TIMESTAMP|DATETIME|BOOLEAN|BOOL|UUID|JSON|JSONB|ARRAY|BYTEA|SERIAL|BIGSERIAL|MONEY|INTERVAL|POINT|LINE|POLYGON|CIRCLE|INET|CIDR|MACADDR|BIT|VARBIT|TSVECTOR|TSQUERY|XML|ENUM|RANGE)\b/gi
  const funcs = /\b(NOW|CURRENT_DATE|CURRENT_TIME|CURRENT_TIMESTAMP|EXTRACT|DATE_PART|DATE_TRUNC|AGE|INTERVAL|CONCAT|SUBSTRING|SUBSTR|LENGTH|CHAR_LENGTH|UPPER|LOWER|TRIM|LTRIM|RTRIM|REPLACE|POSITION|STRPOS|SPLIT_PART|REGEXP_REPLACE|REGEXP_MATCHES|TO_CHAR|TO_DATE|TO_NUMBER|TO_TIMESTAMP|ROUND|CEIL|FLOOR|ABS|MOD|POWER|SQRT|RANDOM|GENERATE_SERIES|ARRAY_AGG|STRING_AGG|JSON_AGG|JSONB_AGG|ROW_TO_JSON|JSON_BUILD_OBJECT|COALESCE|NULLIF|GREATEST|LEAST|CASE)\b/gi
  const nums = /\b(\d+\.?\d*)\b/g
  return applyTokens(code, tokens, s => s
    .replace(kw, m => ansi.magenta(m.toUpperCase()))
    .replace(types, m => ansi.cyan(m.toUpperCase()))
    .replace(funcs, m => ansi.blue(m.toUpperCase()))
    .replace(nums, ansi.yellow('$1')))
}

function highlightDockerfile(code: string): string {
  const tokens = tokenize(code, [
    { regex: /(#.*$)/gm, style: ansi.grey },
    { regex: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, style: ansi.green },
  ])
  const instructions = /^(FROM|RUN|CMD|LABEL|MAINTAINER|EXPOSE|ENV|ADD|COPY|ENTRYPOINT|VOLUME|USER|WORKDIR|ARG|ONBUILD|STOPSIGNAL|HEALTHCHECK|SHELL)\b/gim
  const vars = /(\$\{?[a-zA-Z_]\w*\}?)/g
  const flags = /(--[a-zA-Z-]+=?)/g
  return applyTokens(code, tokens, s => s
    .replace(instructions, m => ansi.magenta(m.toUpperCase()))
    .replace(vars, ansi.cyan('$1'))
    .replace(flags, ansi.blue('$1')))
}

function highlightMarkdown(code: string): string {
  return code
    .replace(/^(#{1,6}\s+.*)$/gm, ansi.blue('$1'))
    .replace(/(\*\*[^*]+\*\*|__[^_]+__)/g, ansi.bold('$1'))
    .replace(/(\*[^*]+\*|_[^_]+_)/g, ansi.italic('$1'))
    .replace(/(`[^`]+`)/g, ansi.yellow('$1'))
    .replace(/^(\s*[-*+]\s)/gm, ansi.red('$1'))
    .replace(/^(\s*\d+\.\s)/gm, ansi.red('$1'))
    .replace(/(\[([^\]]+)\]\([^)]+\))/g, ansi.cyan('$1'))
    .replace(/^(>+\s.*$)/gm, ansi.grey('$1'))
}

function highlightPHP(code: string): string {
  const tokens = tokenize(code, [
    { regex: /(\/\/.*$|#.*$|\/\*[\s\S]*?\*\/)/gm, style: ansi.grey },
    { regex: /(<<<['"]?(\w+)['"]?[\s\S]*?^\2;?$|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/gm, style: ansi.green },
  ])
  const kw = /\b(abstract|and|array|as|break|callable|case|catch|class|clone|const|continue|declare|default|die|do|echo|else|elseif|empty|enddeclare|endfor|endforeach|endif|endswitch|endwhile|eval|exit|extends|final|finally|fn|for|foreach|function|global|goto|if|implements|include|include_once|instanceof|insteadof|interface|isset|list|match|namespace|new|or|print|private|protected|public|readonly|require|require_once|return|static|switch|throw|trait|try|unset|use|var|while|xor|yield|yield from|__CLASS__|__DIR__|__FILE__|__FUNCTION__|__LINE__|__METHOD__|__NAMESPACE__|__TRAIT__|true|false|null)\b/gi
  const vars = /(\$[a-zA-Z_]\w*)/g
  const types = /\b(int|float|bool|string|array|object|callable|iterable|void|mixed|never|self|parent|static)\b/g
  const nums = /\b(0x[0-9a-fA-F]+|0b[01]+|0o[0-7]+|\d+\.?\d*(?:e[+-]?\d+)?)\b/g
  return applyTokens(code, tokens, s => s
    .replace(vars, ansi.blue('$1'))
    .replace(kw, ansi.magenta('$1'))
    .replace(types, ansi.cyan('$1'))
    .replace(nums, ansi.yellow('$1')))
}

function highlightSwift(code: string): string {
  const tokens = tokenize(code, [
    { regex: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm, style: ansi.grey },
    { regex: /("""[\s\S]*?"""|"(?:[^"\\]|\\.)*")/g, style: ansi.green },
  ])
  const kw = /\b(actor|any|as|associatedtype|async|await|break|case|catch|class|continue|convenience|default|defer|deinit|didSet|do|dynamic|else|enum|extension|fallthrough|false|fileprivate|final|for|func|get|guard|if|import|in|indirect|infix|init|inout|internal|is|isolated|lazy|let|mutating|nil|nonisolated|nonmutating|open|operator|optional|override|postfix|precedencegroup|prefix|private|protocol|public|repeat|required|rethrows|return|self|Self|set|some|static|struct|subscript|super|switch|throw|throws|true|try|typealias|unowned|var|weak|where|while|willSet)\b/g
  const types = /\b(Any|AnyObject|Array|Bool|Character|Dictionary|Double|Float|Int|Int8|Int16|Int32|Int64|Never|Optional|Result|Set|String|UInt|UInt8|UInt16|UInt32|UInt64|Void|Error|Codable|Encodable|Decodable|Hashable|Equatable|Comparable|Identifiable|CustomStringConvertible)\b/g
  const attrs = /(@\w+)/g
  const nums = /\b(0x[0-9a-fA-F_]+|0b[01_]+|0o[0-7_]+|\d[\d_]*\.?[\d_]*(?:e[+-]?[\d_]+)?)\b/g
  return applyTokens(code, tokens, s => s
    .replace(attrs, ansi.yellow('$1'))
    .replace(kw, ansi.magenta('$1'))
    .replace(types, ansi.cyan('$1'))
    .replace(nums, ansi.yellow('$1')))
}

function highlightLua(code: string): string {
  const tokens = tokenize(code, [
    { regex: /(--\[\[[\s\S]*?\]\]|--.*$)/gm, style: ansi.grey },
    { regex: /(\[\[[\s\S]*?\]\]|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, style: ansi.green },
  ])
  const kw = /\b(and|break|do|else|elseif|end|false|for|function|goto|if|in|local|nil|not|or|repeat|return|then|true|until|while)\b/g
  const builtins = /\b(assert|collectgarbage|dofile|error|getmetatable|ipairs|load|loadfile|next|pairs|pcall|print|rawequal|rawget|rawlen|rawset|require|select|setmetatable|tonumber|tostring|type|xpcall|coroutine|debug|io|math|os|package|string|table|utf8)\b/g
  const nums = /\b(0x[0-9a-fA-F]+|\d+\.?\d*(?:e[+-]?\d+)?)\b/g
  return applyTokens(code, tokens, s => s
    .replace(kw, ansi.magenta('$1'))
    .replace(builtins, ansi.cyan('$1'))
    .replace(nums, ansi.yellow('$1')))
}

function highlightR(code: string): string {
  const tokens = tokenize(code, [
    { regex: /(#.*$)/gm, style: ansi.grey },
    { regex: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, style: ansi.green },
  ])
  const kw = /\b(if|else|repeat|while|function|for|in|next|break|TRUE|FALSE|NULL|Inf|NaN|NA|NA_integer_|NA_real_|NA_complex_|NA_character_|return|invisible)\b/g
  const funcs = /\b(c|list|data\.frame|matrix|array|factor|vector|length|nrow|ncol|dim|names|rownames|colnames|head|tail|str|summary|print|cat|paste|paste0|sprintf|substr|nchar|grep|grepl|sub|gsub|strsplit|tolower|toupper|trimws|as\.\w+|is\.\w+|which|any|all|sum|mean|median|sd|var|min|max|range|abs|sqrt|exp|log|log10|log2|round|floor|ceiling|trunc|sign|sin|cos|tan|asin|acos|atan|sinh|cosh|tanh|cumsum|cumprod|cummax|cummin|diff|sort|order|rank|unique|duplicated|rev|rep|seq|seq_along|seq_len|append|merge|rbind|cbind|split|apply|lapply|sapply|mapply|tapply|by|aggregate|transform|subset|within|with|attach|detach|library|require|install\.packages|setwd|getwd|read\.csv|read\.table|write\.csv|write\.table|save|load|source|rm|ls|exists|get|assign|environment|new\.env|globalenv|baseenv|emptyenv|parent\.frame|sys\.call|sys\.function|match\.call|match\.arg|missing|nargs|on\.exit|tryCatch|stop|warning|message|suppressWarnings|suppressMessages|options|getOption|setOption|Sys\.time|Sys\.Date|Sys\.sleep|Sys\.getenv|Sys\.setenv|file\.exists|file\.create|file\.remove|file\.copy|file\.rename|dir\.create|dir\.exists|list\.files|list\.dirs|basename|dirname|normalizePath|path\.expand|file\.path|tempfile|tempdir|download\.file|url|readLines|writeLines|readRDS|saveRDS|serialize|unserialize|dput|dump|parse|deparse|substitute|bquote|quote|eval|evalq|expression|call|do\.call|Reduce|Filter|Find|Map|Position|Negate|Compose)\b/g
  const ops = /(<-|->|<<-|->>|=|==|!=|<|>|<=|>=|\+|-|\*|\/|\^|%%|%\/%|%\*%|%in%|%o%|%x%|\||&|!|\$|@|~|::|:::)/g
  const nums = /\b(\d+\.?\d*(?:e[+-]?\d+)?[iL]?)\b/g
  return applyTokens(code, tokens, s => s
    .replace(kw, ansi.magenta('$1'))
    .replace(funcs, ansi.cyan('$1'))
    .replace(ops, ansi.red('$1'))
    .replace(nums, ansi.yellow('$1')))
}

function highlightPerl(code: string): string {
  const tokens = tokenize(code, [
    { regex: /(#.*$)/gm, style: ansi.grey },
    { regex: /(["'`])(?:(?!\1)[^\\]|\\.)*\1/g, style: ansi.green },
    { regex: /(\/(?![*\/])(?:\\.|\[(?:\\.|[^\]])*\]|[^\/\n])+\/[gimsxo]*)/g, style: ansi.yellow },
    { regex: /(m|qr|s|tr|y)([^\w\s])(?:(?!\2)[^\\]|\\.)*\2(?:(?!\2)[^\\]|\\.)*\2[gimsxoe]*/g, style: ansi.yellow },
  ])
  const kw = /\b(if|elsif|else|unless|while|until|for|foreach|do|last|next|redo|goto|return|sub|my|our|local|state|use|no|require|package|BEGIN|END|CHECK|INIT|UNITCHECK|__DATA__|__END__|__FILE__|__LINE__|__PACKAGE__|__SUB__|and|or|not|xor|eq|ne|lt|gt|le|ge|cmp|given|when|default|break|continue|say|print|printf|sprintf|die|warn|exit|eval|exec|system|qw|qq|qx|q)\b/g
  const vars = /([\$@%]\w+|\$[0-9&`'+])/g
  const nums = /\b(0x[0-9a-fA-F_]+|0b[01_]+|0[0-7_]+|\d[\d_]*\.?[\d_]*(?:e[+-]?[\d_]+)?)\b/g
  return applyTokens(code, tokens, s => s
    .replace(vars, ansi.blue('$1'))
    .replace(kw, ansi.magenta('$1'))
    .replace(nums, ansi.yellow('$1')))
}

function highlightScala(code: string): string {
  const tokens = tokenize(code, [
    { regex: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm, style: ansi.grey },
    { regex: /("""[\s\S]*?"""|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, style: ansi.green },
  ])
  const kw = /\b(abstract|case|catch|class|def|do|else|enum|export|extends|extension|false|final|finally|for|forSome|given|if|implicit|import|infix|inline|lazy|match|new|null|object|opaque|open|override|package|private|protected|return|sealed|super|then|this|throw|trait|transparent|true|try|type|using|val|var|while|with|yield)\b/g
  const types = /\b(Any|AnyRef|AnyVal|Boolean|Byte|Char|Double|Float|Int|Long|Nothing|Null|Short|String|Unit|Array|List|Map|Set|Option|Some|None|Either|Left|Right|Try|Success|Failure|Future|Promise|Vector|Seq|IndexedSeq|Iterable|Iterator|Range|Stream|LazyList|Tuple[0-9]*)\b/g
  const annotations = /(@\w+)/g
  const nums = /\b(0x[0-9a-fA-F_]+[lL]?|0b[01_]+[lL]?|\d[\d_]*\.?[\d_]*(?:e[+-]?[\d_]+)?[fFdDlL]?)\b/g
  return applyTokens(code, tokens, s => s
    .replace(annotations, ansi.yellow('$1'))
    .replace(kw, ansi.magenta('$1'))
    .replace(types, ansi.cyan('$1'))
    .replace(nums, ansi.yellow('$1')))
}

function highlightHaskell(code: string): string {
  const tokens = tokenize(code, [
    { regex: /(--.*$|\{-[\s\S]*?-\})/gm, style: ansi.grey },
    { regex: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, style: ansi.green },
  ])
  const kw = /\b(as|case|class|data|default|deriving|do|else|family|forall|foreign|hiding|if|import|in|infix|infixl|infixr|instance|let|mdo|module|newtype|of|proc|qualified|rec|then|type|where|_)\b/g
  const types = /\b(Bool|Char|Double|Either|Eq|Float|Functor|IO|Int|Integer|Maybe|Monad|Num|Ord|Ordering|Read|Show|String|Word|Left|Right|Just|Nothing|True|False|EQ|LT|GT)\b/g
  const ops = /(->|<-|=>|::|\\|@|~|\||=)/g
  const nums = /\b(0x[0-9a-fA-F]+|0o[0-7]+|0b[01]+|\d+\.?\d*(?:e[+-]?\d+)?)\b/g
  return applyTokens(code, tokens, s => s
    .replace(kw, ansi.magenta('$1'))
    .replace(types, ansi.cyan('$1'))
    .replace(ops, ansi.red('$1'))
    .replace(nums, ansi.yellow('$1')))
}

function highlightElixir(code: string): string {
  const tokens = tokenize(code, [
    { regex: /(#.*$)/gm, style: ansi.grey },
    { regex: /("""[\s\S]*?"""|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|~[a-zA-Z](?:\{[^}]*\}|\[[^\]]*\]|\([^)]*\)|<[^>]*>|\/[^\/]*\/|"[^"]*"|'[^']*'|\|[^|]*\|))/g, style: ansi.green },
  ])
  const kw = /\b(after|and|case|catch|cond|def|defcallback|defdelegate|defexception|defguard|defguardp|defimpl|defmacro|defmacrop|defmodule|defoverridable|defp|defprotocol|defstruct|do|else|end|false|fn|for|if|import|in|nil|not|or|quote|raise|receive|require|rescue|true|try|unless|unquote|unquote_splicing|use|when|with)\b/g
  const atoms = /(:[a-zA-Z_]\w*[?!]?)/g
  const modules = /\b([A-Z]\w*)\b/g
  const vars = /(@\w+)/g
  const nums = /\b(0x[0-9a-fA-F_]+|0b[01_]+|0o[0-7_]+|\d[\d_]*\.?[\d_]*(?:e[+-]?[\d_]+)?)\b/g
  return applyTokens(code, tokens, s => s
    .replace(atoms, ansi.cyan('$1'))
    .replace(vars, ansi.blue('$1'))
    .replace(modules, ansi.yellow('$1'))
    .replace(kw, ansi.magenta('$1'))
    .replace(nums, ansi.yellow('$1')))
}

function highlightClojure(code: string): string {
  const tokens = tokenize(code, [
    { regex: /(;.*$)/gm, style: ansi.grey },
    { regex: /("(?:[^"\\]|\\.)*")/g, style: ansi.green },
  ])
  const kw = /\b(def|defn|defn-|defmacro|defmulti|defmethod|defprotocol|defrecord|deftype|defstruct|defonce|fn|let|loop|recur|if|if-not|if-let|if-some|when|when-not|when-let|when-some|when-first|cond|condp|case|do|doto|for|doseq|dotimes|while|try|catch|finally|throw|quote|unquote|unquote-splicing|syntax-quote|var|ns|in-ns|import|require|use|refer|alias|create-ns|find-ns|the-ns|remove-ns|all-ns|ns-name|ns-map|ns-publics|ns-imports|ns-interns|ns-refers|ns-aliases|ns-resolve|resolve|intern|binding|with-bindings|with-local-vars|set!|alter-var-root|thread-bound\?|bound\?|push-thread-bindings|pop-thread-bindings|get-thread-bindings)\b/g
  const builtins = /\b(nil|true|false|first|rest|next|cons|conj|concat|list|list\*|vector|vec|hash-map|hash-set|sorted-map|sorted-set|seq|sequence|lazy-seq|repeatedly|iterate|repeat|range|cycle|interleave|interpose|map|mapv|mapcat|filter|filterv|remove|keep|keep-indexed|reduce|reductions|apply|partial|comp|complement|constantly|identity|fnil|juxt|memoize|trampoline|every\?|some|not-every\?|not-any\?|empty\?|seq\?|coll\?|list\?|vector\?|map\?|set\?|string\?|number\?|integer\?|float\?|rational\?|keyword\?|symbol\?|fn\?|ifn\?|associative\?|sequential\?|sorted\?|counted\?|reversible\?|indexed\?|contains\?|distinct\?|get|get-in|assoc|assoc-in|dissoc|update|update-in|select-keys|keys|vals|find|merge|merge-with|zipmap|into|count|empty|not-empty|nth|peek|pop|last|butlast|take|take-while|take-nth|take-last|drop|drop-while|drop-last|split-at|split-with|partition|partition-all|partition-by|group-by|frequencies|sort|sort-by|reverse|shuffle|rand-nth|flatten|distinct|dedupe|str|subs|format|pr|prn|print|println|pr-str|prn-str|print-str|println-str|with-out-str|read|read-string|slurp|spit|line-seq|re-find|re-matches|re-seq|re-pattern|re-groups|re-matcher|clojure\.string\/join|clojure\.string\/split|clojure\.string\/replace|clojure\.string\/trim|clojure\.string\/lower-case|clojure\.string\/upper-case|clojure\.string\/capitalize|clojure\.string\/blank\?|clojure\.string\/includes\?|clojure\.string\/starts-with\?|clojure\.string\/ends-with\?)\b/g
  const keywords = /(:[a-zA-Z][\w*+!\-'?/<>=]*)/g
  const nums = /\b(-?\d+\.?\d*(?:e[+-]?\d+)?[MN]?|-?\d+\/\d+)\b/g
  return applyTokens(code, tokens, s => s
    .replace(keywords, ansi.cyan('$1'))
    .replace(kw, ansi.magenta('$1'))
    .replace(builtins, ansi.blue('$1'))
    .replace(nums, ansi.yellow('$1')))
}

function highlightZig(code: string): string {
  const tokens = tokenize(code, [
    { regex: /(\/\/.*$)/gm, style: ansi.grey },
    { regex: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, style: ansi.green },
  ])
  const kw = /\b(addrspace|align|allowzero|and|anyframe|anytype|asm|async|await|break|callconv|catch|comptime|const|continue|defer|else|enum|errdefer|error|export|extern|false|fn|for|if|inline|linksection|noalias|noinline|nosuspend|null|opaque|or|orelse|packed|pub|resume|return|struct|suspend|switch|test|threadlocal|true|try|undefined|union|unreachable|var|volatile|while)\b/g
  const types = /\b(i8|i16|i32|i64|i128|isize|u8|u16|u32|u64|u128|usize|f16|f32|f64|f80|f128|bool|void|noreturn|type|anyerror|comptime_int|comptime_float)\b/g
  const builtins = /(@[a-zA-Z_]\w*)/g
  const nums = /\b(0x[0-9a-fA-F_]+|0b[01_]+|0o[0-7_]+|\d[\d_]*\.?[\d_]*(?:e[+-]?[\d_]+)?)\b/g
  return applyTokens(code, tokens, s => s
    .replace(builtins, ansi.cyan('$1'))
    .replace(kw, ansi.magenta('$1'))
    .replace(types, ansi.cyan('$1'))
    .replace(nums, ansi.yellow('$1')))
}

function highlightNim(code: string): string {
  const tokens = tokenize(code, [
    { regex: /(#.*$)/gm, style: ansi.grey },
    { regex: /("""[\s\S]*?"""|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, style: ansi.green },
  ])
  const kw = /\b(addr|and|as|asm|bind|block|break|case|cast|concept|const|continue|converter|defer|discard|distinct|div|do|elif|else|end|enum|except|export|finally|for|from|func|if|import|in|include|interface|is|isnot|iterator|let|macro|method|mixin|mod|nil|not|notin|object|of|or|out|proc|ptr|raise|ref|return|shl|shr|static|template|try|tuple|type|using|var|when|while|xor|yield)\b/g
  const types = /\b(int|int8|int16|int32|int64|uint|uint8|uint16|uint32|uint64|float|float32|float64|bool|char|string|cstring|pointer|void|auto|any|untyped|typed|typedesc|range|array|seq|set|openArray|varargs|tuple|object|ref|ptr|distinct|enum|proc|iterator|converter|method|template|macro)\b/g
  const pragmas = /(\{\.[\w\s,=:]+\.\})/g
  const nums = /\b(0x[0-9a-fA-F_]+|0b[01_]+|0o[0-7_]+|\d[\d_]*\.?[\d_]*(?:e[+-]?[\d_]+)?(?:'[iuf]\d+)?)\b/g
  return applyTokens(code, tokens, s => s
    .replace(pragmas, ansi.yellow('$1'))
    .replace(kw, ansi.magenta('$1'))
    .replace(types, ansi.cyan('$1'))
    .replace(nums, ansi.yellow('$1')))
}

function highlightDiff(code: string): string {
  return code.split('\n').map(line => {
    if (line.startsWith('+++') || line.startsWith('---')) return ansi.bold(line)
    if (line.startsWith('@@')) return ansi.cyan(line)
    if (line.startsWith('+')) return ansi.green(line)
    if (line.startsWith('-')) return ansi.red(line)
    if (line.startsWith('diff') || line.startsWith('index')) return ansi.yellow(line)
    return line
  }).join('\n')
}

function highlightTOML(code: string): string {
  const tokens = tokenize(code, [
    { regex: /(#.*$)/gm, style: ansi.grey },
    { regex: /("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\]|\\.)*"|'[^']*')/g, style: ansi.green },
  ])
  const sections = /^(\s*\[+[^\]]+\]+)/gm
  const keys = /^(\s*[a-zA-Z_-][a-zA-Z0-9_-]*)\s*=/gm
  const bools = /\b(true|false)\b/g
  const nums = /\b(\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?|\d+\.?\d*(?:e[+-]?\d+)?)\b/g
  return applyTokens(code, tokens, s => s
    .replace(sections, ansi.blue('$1'))
    .replace(keys, ansi.cyan('$1') + ' =')
    .replace(bools, ansi.magenta('$1'))
    .replace(nums, ansi.yellow('$1')))
}

function highlightINI(code: string): string {
  const tokens = tokenize(code, [
    { regex: /(;.*$|#.*$)/gm, style: ansi.grey },
    { regex: /("(?:[^"\\]|\\.)*"|'[^']*')/g, style: ansi.green },
  ])
  const sections = /^(\s*\[[^\]]+\])/gm
  const keys = /^(\s*[a-zA-Z_][a-zA-Z0-9_]*)\s*=/gm
  const bools = /\b(true|false|yes|no|on|off)\b/gi
  const nums = /\b(\d+\.?\d*)\b/g
  return applyTokens(code, tokens, s => s
    .replace(sections, ansi.blue('$1'))
    .replace(keys, ansi.cyan('$1') + ' =')
    .replace(bools, ansi.magenta('$1'))
    .replace(nums, ansi.yellow('$1')))
}

function highlightMakefile(code: string): string {
  const tokens = tokenize(code, [
    { regex: /(#.*$)/gm, style: ansi.grey },
    { regex: /("(?:[^"\\]|\\.)*"|'[^']*')/g, style: ansi.green },
  ])
  const targets = /^([a-zA-Z_][a-zA-Z0-9_.-]*):/gm
  const vars = /(\$[\(\{][a-zA-Z_][a-zA-Z0-9_]*[\)\}]|\$[a-zA-Z@<^?*%])/g
  const assigns = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*[:+?]?=/gm
  const directives = /^\s*(ifeq|ifneq|ifdef|ifndef|else|endif|include|-include|sinclude|override|export|unexport|define|endef|undefine|vpath)\b/gm
  const funcs = /\$\((subst|patsubst|strip|findstring|filter|filter-out|sort|word|wordlist|words|firstword|lastword|dir|notdir|suffix|basename|addsuffix|addprefix|join|wildcard|realpath|abspath|error|warning|info|origin|flavor|foreach|if|or|and|call|eval|file|value|shell)\b/g
  return applyTokens(code, tokens, s => s
    .replace(targets, ansi.blue('$1') + ':')
    .replace(assigns, ansi.cyan('$1') + ' =')
    .replace(vars, ansi.yellow('$1'))
    .replace(directives, ansi.magenta('$1'))
    .replace(funcs, '$$(' + ansi.cyan('$1')))
}

function highlightGraphQL(code: string): string {
  const tokens = tokenize(code, [
    { regex: /(#.*$)/gm, style: ansi.grey },
    { regex: /("(?:[^"\\]|\\.)*")/g, style: ansi.green },
  ])
  const kw = /\b(query|mutation|subscription|fragment|on|type|interface|union|enum|scalar|input|extend|schema|directive|implements|repeatable)\b/g
  const types = /\b(Int|Float|String|Boolean|ID)\b/g
  const directives = /(@\w+)/g
  const vars = /(\$\w+)/g
  const nums = /\b(-?\d+\.?\d*(?:e[+-]?\d+)?)\b/g
  const bools = /\b(true|false|null)\b/g
  return applyTokens(code, tokens, s => s
    .replace(directives, ansi.yellow('$1'))
    .replace(vars, ansi.cyan('$1'))
    .replace(kw, ansi.magenta('$1'))
    .replace(types, ansi.cyan('$1'))
    .replace(bools, ansi.magenta('$1'))
    .replace(nums, ansi.yellow('$1')))
}

function highlightProto(code: string): string {
  const tokens = tokenize(code, [
    { regex: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm, style: ansi.grey },
    { regex: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, style: ansi.green },
  ])
  const kw = /\b(syntax|package|import|public|weak|option|message|enum|service|rpc|returns|stream|oneof|map|reserved|to|max|extensions|extend|group|optional|required|repeated|singular)\b/g
  const types = /\b(double|float|int32|int64|uint32|uint64|sint32|sint64|fixed32|fixed64|sfixed32|sfixed64|bool|string|bytes|Any|Duration|Timestamp|Empty|Struct|Value|ListValue|FieldMask|BoolValue|BytesValue|DoubleValue|FloatValue|Int32Value|Int64Value|StringValue|UInt32Value|UInt64Value)\b/g
  const nums = /\b(-?\d+\.?\d*(?:e[+-]?\d+)?)\b/g
  const bools = /\b(true|false)\b/g
  return applyTokens(code, tokens, s => s
    .replace(kw, ansi.magenta('$1'))
    .replace(types, ansi.cyan('$1'))
    .replace(bools, ansi.magenta('$1'))
    .replace(nums, ansi.yellow('$1')))
}

function highlightTerraform(code: string): string {
  const tokens = tokenize(code, [
    { regex: /(#.*$|\/\/.*$|\/\*[\s\S]*?\*\/)/gm, style: ansi.grey },
    { regex: /(<<-?(\w+)[\s\S]*?^\2$|"(?:[^"\\]|\\.)*")/gm, style: ansi.green },
  ])
  const blocks = /\b(resource|data|variable|output|locals|module|provider|terraform|backend|required_providers|required_version|provisioner|connection|lifecycle|dynamic|for_each|count|depends_on|moved|import|check)\b/g
  const types = /\b(string|number|bool|list|map|set|object|tuple|any)\b/g
  const funcs = /\b(abs|ceil|floor|log|max|min|pow|signum|chomp|format|formatlist|indent|join|lower|regex|regexall|replace|split|strrev|substr|title|trim|trimprefix|trimsuffix|trimspace|upper|alltrue|anytrue|chunklist|coalesce|coalescelist|compact|concat|contains|distinct|element|flatten|index|keys|length|list|lookup|map|matchkeys|merge|one|range|reverse|setintersection|setproduct|setsubtract|setunion|slice|sort|sum|transpose|values|zipmap|base64decode|base64encode|base64gzip|csvdecode|jsondecode|jsonencode|textdecodebase64|textencodebase64|urlencode|yamldecode|yamlencode|abspath|dirname|pathexpand|basename|file|fileexists|fileset|filebase64|templatefile|formatdate|timeadd|timestamp|base64sha256|base64sha512|bcrypt|filebase64sha256|filebase64sha512|filemd5|filesha1|filesha256|filesha512|md5|rsadecrypt|sha1|sha256|sha512|uuid|uuidv5|cidrhost|cidrnetmask|cidrsubnet|cidrsubnets|can|nonsensitive|sensitive|tobool|tolist|tomap|tonumber|toset|tostring|try|type)\b/g
  const vars = /(\$\{[^}]+\}|var\.[a-zA-Z_]\w*|local\.[a-zA-Z_]\w*|data\.[a-zA-Z_]\w*\.[a-zA-Z_]\w*|module\.[a-zA-Z_]\w*|each\.\w+|count\.\w+|self\.\w+|path\.\w+|terraform\.\w+)/g
  const nums = /\b(-?\d+\.?\d*(?:e[+-]?\d+)?)\b/g
  const bools = /\b(true|false|null)\b/g
  return applyTokens(code, tokens, s => s
    .replace(blocks, ansi.magenta('$1'))
    .replace(types, ansi.cyan('$1'))
    .replace(funcs, ansi.blue('$1'))
    .replace(vars, ansi.yellow('$1'))
    .replace(bools, ansi.magenta('$1'))
    .replace(nums, ansi.yellow('$1')))
}
