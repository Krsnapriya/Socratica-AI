/**
 * C++ Compile Error Handler
 * Spec Section 6: Short-circuits compilation errors.
 */

function isCompileError(studentResult) {
  if (!studentResult) return false;
  const error = studentResult.error || studentResult.student?.error;
  const verdict = studentResult.verdict || studentResult.student?.verdict;
  return error === 'compile_error' || verdict === 'compile_error';
}

function formatCompileError(studentResult) {
  const inner = studentResult.student || studentResult;
  return {
    verdict: 'compile_error',
    compileError: inner.stderr || inner.error || 'Compilation failed',
    round: studentResult.round || 1,
    steps: 0,
    elapsed_ms: inner.elapsed_ms || 0,
    snapshots: [],
    stdout: ''
  };
}

module.exports = { isCompileError, formatCompileError };
