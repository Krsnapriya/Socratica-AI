/**
 * C++ Compile Error Handler
 * Spec Section 6: Short-circuits compilation errors.
 */

function isCompileError(studentResult) {
  return studentResult && (studentResult.error === 'compile_error' || studentResult.verdict === 'compile_error');
}

function formatCompileError(studentResult) {
  return {
    verdict: 'compile_error',
    compileError: studentResult.stderr || studentResult.error || 'Compilation failed',
    round: studentResult.round || 1,
    steps: 0,
    elapsed_ms: 0,
    snapshots: [],
    stdout: ''
  };
}

module.exports = { isCompileError, formatCompileError };
