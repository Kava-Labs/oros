import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface SanitizeOptions {
  ADD_ATTR: string[];
  ALLOW_SCRIPTS: boolean;
  ALLOW_UNKNOWN_PROTOCOLS: boolean;
}

export async function sanitizeContent(content: string): Promise<string> {
  const htmlContent: string = await marked.parse(content);

  // Configure links to open in new tabs
  const afterSanitizeAttributes = (node: Element): void => {
    if (node.tagName === 'A') {
      const href = node.getAttribute('href');

      if (!href || href.startsWith('javascript:')) {
        node.removeAttribute('href');
        return;
      }

      // Set attributes for opening in new tab securely
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  };

  DOMPurify.addHook('afterSanitizeAttributes', afterSanitizeAttributes);

  const options: SanitizeOptions = {
    ADD_ATTR: ['target', 'rel'],
    ALLOW_SCRIPTS: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
  };

  const sanitizedHtml = DOMPurify.sanitize(htmlContent, options);
  DOMPurify.removeHook('afterSanitizeAttributes');

  return sanitizedHtml;
}
