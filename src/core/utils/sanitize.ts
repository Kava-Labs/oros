import DOMPurify from 'dompurify';

import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';

const marked = new Marked(
  markedHighlight({
    emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    },
  }),
);

interface SanitizeOptions {
  ADD_ATTR: string[];
  ALLOW_SCRIPTS: boolean;
  ALLOW_UNKNOWN_PROTOCOLS: boolean;
}

export async function sanitizeContent(content: string): Promise<string> {
  // Check for incomplete markdown links and return just the text portion
  const processLinks = (text: string): string => {
    // If we see a partial end of a link like "Claude](..." or just "](..."
    text = text.replace(/[^[]*\]\([^)]*$/, '');

    // If we see a partial start of a link like "[Cla..."
    text = text.replace(/\[[^\]]*$/, '');

    // Complete links will be handled by marked
    return text;
  };

  const processedContent = processLinks(content);
  const htmlContent: string = await marked.parse(processedContent);

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
