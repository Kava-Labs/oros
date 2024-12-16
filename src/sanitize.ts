import DOMPurify from 'dompurify';
import { marked } from 'marked';

export async function sanitizeContent(content: string): Promise<string> {
  const htmlContent = await marked.parse(content);
  const sanitizedHtml = DOMPurify.sanitize(htmlContent);
  return sanitizedHtml;
}
