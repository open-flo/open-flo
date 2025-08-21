/**
 * Lightweight markdown parser utility
 */
export class MarkdownUtils {
  /**
   * Parse markdown text to HTML
   * @param {string} markdown - The markdown text to parse
   * @returns {string} - The HTML output
   */
  static parseToHtml(markdown) {
    if (!markdown || typeof markdown !== 'string') {
      return '';
    }

    let html = markdown;

    // Escape HTML entities first to prevent XSS
    html = this.escapeHtml(html);

    // Parse headers (must come before other parsing)
    html = this.parseHeaders(html);

    // Parse code blocks (must come before inline code)
    html = this.parseCodeBlocks(html);

    // Parse inline code
    html = this.parseInlineCode(html);

    // Parse bold text (must come before italic)
    html = this.parseBold(html);

    // Parse italic text
    html = this.parseItalic(html);

    // Parse links
    html = this.parseLinks(html);

    // Parse line breaks
    html = this.parseLineBreaks(html);

    // Parse lists
    html = this.parseLists(html);

    // Parse blockquotes
    html = this.parseBlockquotes(html);

    return html.trim();
  }

  /**
   * Escape HTML entities for security
   * @param {string} text - Text to escape
   * @returns {string} - Escaped text
   */
  static escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Parse headers (# ## ###)
   * @param {string} text - Text to parse
   * @returns {string} - Parsed text
   */
  static parseHeaders(text) {
    return text.replace(/^(#{1,6})\s+(.+)$/gm, (match, hashes, content) => {
      const level = hashes.length;
      return `<h${level} style="margin: 12px 0 8px 0; font-weight: 600; color: #111827;">${content}</h${level}>`;
    });
  }

  /**
   * Parse code blocks (```)
   * @param {string} text - Text to parse
   * @returns {string} - Parsed text
   */
  static parseCodeBlocks(text) {
    return text.replace(/```([^`]+)```/g, (match, code) => {
      return `<pre style="background: #f5f5f5; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; margin: 8px 0; overflow-x: auto; font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace; font-size: 13px; line-height: 1.4;"><code>${code.trim()}</code></pre>`;
    });
  }

  /**
   * Parse inline code (`)
   * @param {string} text - Text to parse
   * @returns {string} - Parsed text
   */
  static parseInlineCode(text) {
    return text.replace(/`([^`]+)`/g, (match, code) => {
      return `<code style="background: #f5f5f5; border: 1px solid #e5e7eb; border-radius: 3px; padding: 2px 4px; font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace; font-size: 12px;">${code}</code>`;
    });
  }

  /**
   * Parse bold text (**)
   * @param {string} text - Text to parse
   * @returns {string} - Parsed text
   */
  static parseBold(text) {
    return text.replace(/\*\*([^*]+)\*\*/g, '<strong style="font-weight: 600;">$1</strong>');
  }

  /**
   * Parse italic text (*)
   * @param {string} text - Text to parse
   * @returns {string} - Parsed text
   */
  static parseItalic(text) {
    return text.replace(/\*([^*]+)\*/g, '<em style="font-style: italic;">$1</em>');
  }

  /**
   * Parse links ([text](url))
   * @param {string} text - Text to parse
   * @returns {string} - Parsed text
   */
  static parseLinks(text) {
    return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, url) => {
      // Basic URL validation
      const urlPattern = /^(https?:\/\/|mailto:|tel:)/;
      if (!urlPattern.test(url)) {
        return match; // Return original if URL is not valid
      }
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #8b5cf6; text-decoration: underline;">${linkText}</a>`;
    });
  }

  /**
   * Parse line breaks
   * @param {string} text - Text to parse
   * @returns {string} - Parsed text
   */
  static parseLineBreaks(text) {
    return text.replace(/\n\n/g, '</p><p style="margin: 0 0 12px 0;">').replace(/\n/g, '<br>');
  }

  /**
   * Parse lists (- or * for unordered, 1. for ordered)
   * @param {string} text - Text to parse
   * @returns {string} - Parsed text
   */
  static parseLists(text) {
    // Unordered lists
    text = text.replace(/^[\s]*[-*]\s+(.+)$/gm, '<li style="margin: 4px 0;">$1</li>');
    text = text.replace(/(<li[^>]*>.*<\/li>)/s, '<ul style="margin: 8px 0; padding-left: 20px;">$1</ul>');

    // Ordered lists
    text = text.replace(/^[\s]*\d+\.\s+(.+)$/gm, '<li style="margin: 4px 0;">$1</li>');
    text = text.replace(/(<li[^>]*>.*<\/li>)/s, '<ol style="margin: 8px 0; padding-left: 20px;">$1</ol>');

    return text;
  }

  /**
   * Parse blockquotes (>)
   * @param {string} text - Text to parse
   * @returns {string} - Parsed text
   */
  static parseBlockquotes(text) {
    return text.replace(/^>\s+(.+)$/gm, '<blockquote style="border-left: 4px solid #8b5cf6; margin: 8px 0; padding: 8px 0 8px 12px; color: #6b7280; font-style: italic;">$1</blockquote>');
  }

  /**
   * Sanitize HTML to prevent XSS attacks
   * @param {string} html - HTML to sanitize
   * @returns {string} - Sanitized HTML
   */
  static sanitizeHtml(html) {
    // Create a temporary div to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Remove dangerous elements
    const dangerousElements = temp.querySelectorAll('script, iframe, object, embed, form, input, button');
    dangerousElements.forEach(el => el.remove());

    // Remove dangerous attributes
    const allElements = temp.querySelectorAll('*');
    allElements.forEach(el => {
      const allowedAttributes = ['href', 'target', 'rel', 'style'];
      const attributes = Array.from(el.attributes);
      attributes.forEach(attr => {
        if (!allowedAttributes.includes(attr.name.toLowerCase())) {
          el.removeAttribute(attr.name);
        }
      });

      // Validate href attributes
      if (el.hasAttribute('href')) {
        const href = el.getAttribute('href');
        const urlPattern = /^(https?:\/\/|mailto:|tel:|#)/;
        if (!urlPattern.test(href)) {
          el.removeAttribute('href');
        }
      }
    });

    return temp.innerHTML;
  }
} 