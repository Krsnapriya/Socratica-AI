/**
 * Deprecated — merged into server/ai/llmClient.js
 * This shim re-exports for backward compatibility.
 */
const { generateSocraticHint, generateCompileHint } = require('../ai/llmClient');

async function generateHint(code, language, problemStatement, errorLog, verdict) {
  return generateCompileHint(code, language, problemStatement, errorLog, verdict);
}

module.exports = { generateHint, generateSocraticHint, generateCompileHint };
