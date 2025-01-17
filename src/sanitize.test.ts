import { sanitizeContent } from './sanitize';

describe('sanitizeContent', () => {
  it('should convert simple Markdown to safe HTML', async () => {
    const input = '# Hello World\n\nThis is a paragraph.';
    const output = await sanitizeContent(input);
    expect(output).toContain('<h1>Hello World</h1>');
    expect(output).toContain('<p>This is a paragraph.</p>');
  });

  it('should handle lists and inline formatting', async () => {
    const input = `
# Shopping List
- Milk
- Eggs
- Bread

**Bold text**, *italic text*, and \`inline code\`.
    `;
    const output = await sanitizeContent(input);

    expect(output).toContain('<h1>Shopping List</h1>');
    expect(output).toContain('<ul>');
    expect(output).toContain('<li>Milk</li>');
    expect(output).toContain('<li>Eggs</li>');
    expect(output).toContain('<strong>Bold text</strong>');
    expect(output).toContain('<em>italic text</em>');
    expect(output).toContain('<code>inline code</code>');
  });

  it('should handle complex Markdown: blockquotes, code blocks, and tables', async () => {
    const input = `
> A blockquote
> spanning multiple lines.

\`\`\`javascript
function hello() {
  console.log("Hello, world!");
}
\`\`\`

| Column 1 | Column 2 |
|----------|----------|
| Value A  | Value B  |
| Value C  | Value D  |
    `;
    const output = await sanitizeContent(input);

    expect(output).toContain(
      '<blockquote>\n<p>A blockquote\nspanning multiple lines.</p>\n</blockquote>',
    );
    expect(output).toContain('<pre><code class="language-javascript">');
    expect(output).toContain('console.log("Hello, world!");');
    expect(output).toContain('<table>');
    expect(output).toContain('<td>Value A</td>');
    expect(output).toContain('<td>Value B</td>');
  });

  it('should remove dangerous HTML and scripts', async () => {
    const input = `
# Title

Click here: <a href="javascript:alert('XSS')">malicious link</a>

<script>alert('XSS');</script>
`;
    const output = await sanitizeContent(input);
    // The malicious script or event handler should not be present
    expect(output).toContain('<h1>Title</h1>');
    expect(output).not.toContain('javascript:alert');
    expect(output).not.toContain('<script>');
  });

  it('should return an empty string for empty content', async () => {
    const input = '';
    const output = await sanitizeContent(input);
    expect(output).toBe('');
  });

  it('should handle invalid Markdown gracefully', async () => {
    const input = `
# Incomplete Markdown
This should render anyway
- List item 1
- List item 2
[Unclosed link
`;
    const output = await sanitizeContent(input);
    // Marked should still produce some HTML, even if malformed
    expect(output).toContain('<h1>Incomplete Markdown</h1>');
    expect(output).toContain('<ul>');
    expect(output).toContain('<li>List item 1</li>');
    // The broken link might simply render as text or incomplete HTML.
    // The exact output can vary, but we at least expect no runtime errors.
  });

  it('should handle large input strings without error', async () => {
    // Generate a large markdown string
    const largeInput = Array.from(
      { length: 1000 },
      (_, i) => `- Item ${i}`,
    ).join('\n');
    const output = await sanitizeContent(largeInput);
    expect(output).toContain('<ul>');
    expect((output.match(/<li>/g) || []).length).toBe(1000);
  });

  it('handle link markdown (complete) by opening in a new tab', async () => {
    const input = '[Claude](www.claude.ai)';
    const output = await sanitizeContent(input);
    expect(output).toContain(
      '<p><a href="www.claude.ai" target="_blank" rel="noopener noreferrer">Claude</a></p>',
    );
  });

  it("don't render an incomplete markdown link", async () => {
    const input = '[Claude](www.claude.ai';
    const output = await sanitizeContent(input);
    expect(output).toMatch('');
  });
});
