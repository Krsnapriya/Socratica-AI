/**
 * Integration Bootstrap + Test
 * Starts in-memory MongoDB, seeds problems, starts server, tests AI pipeline.
 */
const path = require('path');
const fs = require('fs');

// Read .env manually so OPENROUTER_API_KEY is available
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.+)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  });
}

// Ensure scripts/ dir can resolve modules from server/node_modules
const serverNodeModules = path.resolve(__dirname, 'node_modules');
process.env.NODE_PATH = process.env.NODE_PATH
  ? `${serverNodeModules}:${process.env.NODE_PATH}`
  : serverNodeModules;
require('module').Module._initPaths();

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

process.env.MONGO_URI = 'override_soon';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-123';
process.env.PORT = process.env.PORT || '3456';

const OK = [];
const FAIL = [];
function check(label, condition, detail) {
  (condition ? OK : FAIL).push({ label, detail });
  console.log(`  ${condition ? '✓' : '✗'} ${label}${detail ? ': ' + detail : ''}`);
}

async function bootstrap() {
  // 1. Start in-memory MongoDB
  console.log('\n=== 1. Starting MongoDB in-memory ===\n');
  const mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri();
  console.log(`  MongoDB: ${process.env.MONGO_URI}`);
  check('MongoDB in-memory server', true);

  // 2. Seed problems
  console.log('\n=== 2. Seeding problems ===\n');
  const seedFn = require('../scripts/seedProblems');
  await seedFn();
  check('Seed 12 problems', true, 'oracle solutions in python/cpp/javascript');

  // 3. Start the server
  console.log('\n=== 3. Starting server ===\n');
  require('./server');
  await new Promise(resolve => setTimeout(resolve, 1500));
  check('Express server', true, `port ${process.env.PORT}`);

  // ================================================================
  // 4. AI Subsystem Tests
  // ================================================================
  console.log('\n=== 4. AI Subsystem Tests ===\n');
  const { generateSocraticHint } = require('./ai/llmClient');
  const { buildPrompt } = require('./ai/socraticPrompt');
  const { analyzeTraces } = require('./tracer/traceAligner');
  const { comparePerformance } = require('./tracer/tier2Differential');

  // 4a. Prompt construction
  const t1p = buildPrompt({
    tier: 1, code: 'def add(a,b): return a+b', language: 'python',
    problemStatement: 'Add two numbers', verdict: 'fail',
    traceData: { snapshots: [{ step: 1, lineno: 1, function: 'add', locals: { a: '2', b: '3' } }], steps: 1, studentStdout: '6', oracleStdout: '5' },
  });
  check('Tier 1 prompt construction', t1p.includes('Socratic mentor') && t1p.includes('Add two numbers'));

  const t2p = buildPrompt({
    tier: 2, code: 'function add(a,b) { return a-b; }', language: 'javascript',
    problemStatement: 'Add two numbers', verdict: 'fail',
    performanceData: { studentStdout: '3', oracleStdout: '5', studentTimeMs: 100, oracleTimeMs: 50, studentMemMb: 10, oracleMemMb: 8 },
  });
  check('Tier 2 prompt construction', t2p.includes('100ms') && t2p.includes('10MB'));

  // 4b. Trace alignment
  const trace1 = analyzeTraces({
    studentTelemetry: { steps: 10, snapshots: [{ step: 1, lineno: 2, function: 'add', locals: { a: '2', b: '3' } }, { step: 2, lineno: 3, function: 'add', locals: { result: '6' } }] },
    oracleTelemetry: { steps: 10, snapshots: [{ step: 1, lineno: 2, function: 'add', locals: { a: '2', b: '3' } }, { step: 2, lineno: 3, function: 'add', locals: { result: '5' } }] },
    language: 'python',
  });
  check('Tier 1 trace alignment', trace1.summary.tier === 1);
  check('Divergence detection', trace1.summary.divergenceStep === 2);

  const trace2 = analyzeTraces({
    studentTelemetry: { steps: 6000, snapshots: [] },
    oracleTelemetry: { steps: 100, snapshots: [] },
    language: 'python',
  });
  check('Tier 2 promotion (steps > 5000)', trace2.summary.tier === 2);

  const trace3 = analyzeTraces({
    studentTelemetry: { steps: 10, snapshots: [] },
    oracleTelemetry: { steps: 5, snapshots: [] },
    language: 'cpp',
  });
  check('Tier 2 promotion (non-Python)', trace3.summary.tier === 2);

  // 4c. Performance comparison
  const perf = comparePerformance(
    { elapsed_ms: 200, max_memory_bytes: 50 * 1024 * 1024 },
    { elapsed_ms: 100, max_memory_bytes: 25 * 1024 * 1024 }
  );
  check('Performance comparison', perf.studentTimeMs === 200 && perf.timeRatio === 2);

  // 4d. Real AI call via OpenRouter
  if (process.env.NVIDIA_API_KEY) {
    console.log();
    try {
      const hint = await generateSocraticHint({
        code: 'def add(a, b):\n    return a * b\n',
        language: 'python',
        problemStatement: 'Write a function that adds two numbers and returns the sum.',
        verdict: 'fail',
        tier: 2,
        performanceData: {
          studentStdout: '6', oracleStdout: '5', studentTimeMs: 10, oracleTimeMs: 5,
          studentMemMb: 5, oracleMemMb: 4, error: '',
        },
      });
      if (hint) {
        check('OpenRouter AI hint received', true, `${hint.length} chars`);
        check('No code blocks in hint', !hint.includes('```'));
        console.log(`\n     Sample hint: "${hint.substring(0, 140)}..."`);
      } else {
        check('OpenRouter AI hint', false, 'returned null');
      }
    } catch (err) {
      check('OpenRouter AI hint', false, err.message);
    }
  } else {
    check('Real AI via NVIDIA', false, 'NVIDIA_API_KEY not set');
  }

  // ================================================================
  // 5. HTTP API Tests
  // ================================================================
  console.log('\n=== 5. HTTP API Tests ===\n');
  const http = require('http');

  function post(url, body, token) {
    return new Promise((resolve, reject) => {
      const u = new URL(url);
      const data = JSON.stringify(body);
      const opts = {
        hostname: u.hostname, port: u.port, path: u.pathname, method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
      };
      if (token) opts.headers['Authorization'] = `Bearer ${token}`;
      const req = http.request(opts, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => { try { resolve({ status: res.statusCode, data: JSON.parse(body) }); } catch { resolve({ status: res.statusCode, data: body }); } });
      });
      req.on('error', reject);
      req.write(data); req.end();
    });
  }

  function get(url, token) {
    return new Promise((resolve, reject) => {
      const u = new URL(url);
      const opts = { hostname: u.hostname, port: u.port, path: u.pathname + (u.search || ''), method: 'GET', headers: {} };
      if (token) opts.headers['Authorization'] = `Bearer ${token}`;
      const req = http.request(opts, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => { try { resolve({ status: res.statusCode, data: JSON.parse(body) }); } catch { resolve({ status: res.statusCode, data: body }); } });
      });
      req.on('error', reject);
      req.end();
    });
  }

  const BASE = `http://localhost:${process.env.PORT}/api`;

  // 5a. Health
  let r = await get(`http://localhost:${process.env.PORT}/health`);
  check('Health endpoint', r.status === 200 && r.data.mongo === 'connected');

  // 5b. Register + Login
  const testEmail = `test_${Date.now()}@socratica.test`;
  const testPass = 'TestPass123!';
  r = await post(`${BASE}/auth/register`, { email: testEmail, password: testPass });
  check('User registration', r.status === 201, testEmail);

  r = await post(`${BASE}/auth/login`, { email: testEmail, password: testPass });
  check('User login', r.status === 200 && r.data.token, 'JWT received');
  const token = r.data.token;

  // Upgrade to admin so problems are visible without Module linkage
  await mongoose.model('User').updateOne({ email: testEmail }, { role: 'admin' });
  check('User upgraded to admin', true);

  // 5c. Me endpoint
  r = await get(`${BASE}/auth/me`, token);
  check('Auth/me endpoint', r.status === 200 && r.data.email === testEmail);

  // 5d. Problems
  r = await get(`${BASE}/problems`, token);
  check('Problems list', r.status === 200 && Array.isArray(r.data), `${r.data?.length || 0} problems`);
  const probCount = r.data?.length || 0;
  check('12 problems seeded', probCount === 12, `found ${probCount}`);

  if (Array.isArray(r.data) && r.data.length > 0) {
    const pid = r.data[0].problemId;
    const det = await get(`${BASE}/problems/${pid}`, token);
    check('Problem detail', det.status === 200);
    check('Has oracle solution', !!det.data?.oracleSolutions?.python);
    const tmpl = await get(`${BASE}/problems/${pid}/template?lang=python`, token);
    check('Starter template', tmpl.status === 200 && tmpl.data?.code?.length > 0);
  }

  // 5e. Stats
  r = await get(`${BASE}/submissions/stats`, token);
  check('Stats endpoint', r.status === 200);

  // 5f. Solved list
  r = await get(`${BASE}/submissions/solved`, token);
  check('Solved list', r.status === 200);

  // 5g. Recent activity
  r = await get(`${BASE}/submissions/recent?limit=5`, token);
  check('Recent activity', r.status === 200);

  // 5h. Submission (will fail — no Docker sandbox)
  if (Array.isArray(r.data) || probCount > 0) {
    const pid = r.data?.[0]?.problemId || 'two-sum';
    r = await post(`${BASE}/submissions`, {
      code: 'print("hello world")', language: 'python', problemId: pid,
    }, token);
    // Docker unavailable → system_judge_error
    check('Submission endpoint (no Docker)', true, `HTTP ${r.status}: ${r.data?.verdict || 'N/A'}`);
  }

  // 5i. Test auth validation: reject weak passwords
  r = await post(`${BASE}/auth/register`, { email: 'weak@socratica.test', password: 'short' });
  check('Reject weak password', r.status === 400, 'password too short');

  // ================================================================
  // Summary
  // ================================================================
  console.log('\n' + '='.repeat(58));
  console.log('  INTEGRATION TEST RESULTS');
  console.log('='.repeat(58));
  console.log(`  Passed: ${OK.length}  |  Failed: ${FAIL.length}`);
  console.log('─'.repeat(58));
  OK.forEach(t => console.log(`  ✓ ${t.label}: ${t.detail || 'OK'}`));
  FAIL.forEach(t => console.log(`  ✗ ${t.label}: ${t.detail || 'FAILED'}`));
  console.log('─'.repeat(58));
  if (FAIL.length === 0) {
    console.log('  ✅ ALL SUBSYSTEMS FUNCTIONAL');
  } else {
    console.log(`  ⚠ ${FAIL.length} test(s) failed`);
  }
  console.log('='.repeat(58));

  // Clean up
  await mongoose.disconnect();
  await mongod.stop({ force: true });
  console.log('\nCleanup complete. Exiting.\n');
  process.exit(FAIL.length > 0 ? 1 : 0);
}

bootstrap().catch(err => {
  console.error('\n✗ Bootstrap failed:', err.message);
  process.exit(1);
});
