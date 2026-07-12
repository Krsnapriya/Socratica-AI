/**
 * Minimal XSS sanitization for user-provided content.
 * Strips HTML tags that could execute scripts while preserving safe markup.
 */
function sanitizeHtml(str) {
  if (!str) return str;
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*on\w+\s*=\s*["'][^"']*["'][^>]*>/gi, '')
    .replace(/<[^>]*on\w+\s*=\s*[^\s>]+[^>]*>/gi, '')
    .replace(/<iframe\b[^>]*>/gi, '')
    .replace(/<\/iframe>/gi, '')
    .replace(/<object\b[^>]*>/gi, '')
    .replace(/<\/object>/gi, '')
    .replace(/<embed\b[^>]*>/gi, '')
    .replace(/<form\b[^>]*>/gi, '')
    .replace(/<\/form>/gi, '')
    .replace(/javascript\s*:/gi, '');
}

function sanitizeProblemInput(data) {
  const sanitized = { ...data };
  if (sanitized.statement) sanitized.statement = sanitizeHtml(sanitized.statement);
  if (sanitized.description) sanitized.description = sanitizeHtml(sanitized.description);
  if (sanitized.title) sanitized.title = sanitizeHtml(sanitized.title);
  return sanitized;
}

module.exports = { sanitizeHtml, sanitizeProblemInput };
