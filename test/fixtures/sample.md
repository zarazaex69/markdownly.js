# Sample Markdown Document

This is a **comprehensive** test document with *various* markdown features.

## Code Blocks

### JavaScript Example

```javascript
function greet(name) {
  return `Hello, ${name}!`
}

const message = greet("World")
console.log(message)
```

### Python Example

```python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# Generate first 10 fibonacci numbers
for i in range(10):
    print(f"F({i}) = {fibonacci(i)}")
```

## Lists and Tasks

### Unordered List

- First item with **bold** text
- Second item with *italic* text
- Third item with `inline code`
  - Nested item
  - Another nested item
    - Deep nested item

### Ordered List

1. Step one
2. Step two with [external link](https://example.com)
3. Step three
   1. Sub-step A
   2. Sub-step B

### Task List

- [x] Completed task
- [ ] Pending task
- [x] Another completed task
- [ ] Future task

## Tables

| Feature | Supported | Notes |
|---------|-----------|-------|
| Headers | ✅ | H1-H6 |
| Lists | ✅ | Ordered & Unordered |
| Code | ✅ | Inline & Blocks |
| Tables | ✅ | With alignment |
| Links | ✅ | Internal & External |

## Quotes and Alerts

### Regular Blockquote

> This is a regular blockquote.
> It can span multiple lines.
> 
> And have multiple paragraphs.

### Nested Blockquote

> This is the outer quote.
> 
> > This is a nested quote.
> > It's indented further.
> 
> Back to the outer quote.

### GitHub-style Alerts

> [!NOTE]
> This is a note alert with **bold** text and *italic* text.

> [!TIP]
> Pro tip: Use alerts to highlight important information.

> [!IMPORTANT]
> This is critically important information.

> [!WARNING]
> Be careful when following these instructions.

> [!CAUTION]
> This could be dangerous if not done properly.

## Formatting

### Inline Formatting

This paragraph contains **bold text**, *italic text*, `inline code`, 
~~strikethrough text~~, ==highlighted text==, ++inserted text++, 
H~2~O (subscript), and E=mc^2^ (superscript).

### Links and Images

Here's a [link to Google](https://google.com) and an ![example image](https://via.placeholder.com/150).

### Horizontal Rules

---

## Advanced Features

### Escaped Characters

You can escape special characters: \*not bold\*, \_not italic\_, \`not code\`.

### Mixed Content

Here's a paragraph with `code`, **bold**, *italic*, and a [link](https://example.com) all together.

```json
{
  "name": "test-document",
  "version": "1.0.0",
  "features": [
    "markdown parsing",
    "syntax highlighting",
    "terminal rendering"
  ],
  "metadata": {
    "created": "2024-01-01",
    "author": "Test Author",
    "tags": ["test", "markdown", "sample"]
  }
}
```

### Final Notes

This document tests most markdown features supported by the parser.
It includes edge cases and complex nested structures to ensure
robust parsing and rendering.

---

*End of document*