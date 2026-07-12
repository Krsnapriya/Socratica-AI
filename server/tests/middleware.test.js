process.env.JWT_SECRET = 'test-secret-key-for-jest';
process.env.REDIS_URI = '';
process.env.MONGODB_URI = 'mongodb://localhost:27017/socratica-test';

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const httpMocks = require('node-mocks-http');

function mockReqRes(overrides = {}) {
  const req = httpMocks.createRequest(overrides);
  const res = httpMocks.createResponse();
  return { req, res };
}

describe('requireAuth middleware', () => {
  let requireAuth;

  beforeAll(async () => {
    requireAuth = require('../middleware/requireAuth');
  });

  it('rejects missing auth header', async () => {
    const { req, res } = mockReqRes({ headers: {} });
    await requireAuth(req, res, () => {});
    expect(res.statusCode).toBe(401);
    expect(res._getJSONData().error).toMatch(/token required/i);
  });

  it('rejects non-Bearer auth header', async () => {
    const { req, res } = mockReqRes({ headers: { authorization: 'Basic xyz' } });
    await requireAuth(req, res, () => {});
    expect(res.statusCode).toBe(401);
    expect(res._getJSONData().error).toMatch(/token required/i);
  });

  it('rejects invalid token', async () => {
    const { req, res } = mockReqRes({ headers: { authorization: 'Bearer invalid-token-here' } });
    await requireAuth(req, res, () => {});
    expect(res.statusCode).toBe(401);
    expect(res._getJSONData().error).toMatch(/not authorized|invalid|expired/i);
  });
});

describe('requireRole middleware', () => {
  let requireRole;

  beforeAll(async () => {
    requireRole = require('../middleware/requireRole');
  });

  it('rejects guest role with 401', async () => {
    const middleware = requireRole(['student', 'admin']);
    const { req, res } = mockReqRes({ userId: null, userRole: 'guest' });
    await middleware(req, res, () => {});
    expect(res.statusCode).toBe(401);
    expect([401, 403]).toContain(res.statusCode);
  });
});

describe('tokenBlacklist', () => {
  let tokenBlacklist;

  beforeAll(async () => {
    tokenBlacklist = require('../middleware/tokenBlacklist');
  });

  it('exports revokeToken and isRevoked functions', () => {
    expect(typeof tokenBlacklist.revokeToken).toBe('function');
    expect(typeof tokenBlacklist.isRevoked).toBe('function');
  });

  it('isRevoked returns false for unknown token (no Redis)', async () => {
    const result = await tokenBlacklist.isRevoked('some-token');
    expect(result).toBe(false);
  });
});

describe('validate middleware', () => {
  let validate, schemas;

  beforeAll(async () => {
    const v = require('../middleware/validate');
    validate = v.validate;
    schemas = v.schemas;
  });

  it('exports register schema', () => {
    expect(schemas.register).toBeDefined();
  });

  it('rejects invalid email on register schema', () => {
    const result = schemas.register.safeParse({ email: 'not-an-email', password: 'ValidPass123!@#' });
    expect(result.success).toBe(false);
  });

  it('accepts valid register data', () => {
    const result = schemas.register.safeParse({ email: 'test@example.com', password: 'ValidPass123!@#' });
    expect(result.success).toBe(true);
  });

  it('rejects short password on register', () => {
    const result = schemas.register.safeParse({ email: 'test@example.com', password: 'short' });
    expect(result.success).toBe(false);
  });

  it('rejects missing code on submission schema', () => {
    const result = schemas.submission.safeParse({ language: 'python', problemId: 'test' });
    expect(result.success).toBe(false);
  });

  it('accepts valid submission data', () => {
    const result = schemas.submission.safeParse({ code: 'print("hello")', language: 'python', problemId: 'hello-world' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid language on submission', () => {
    const result = schemas.submission.safeParse({ code: 'print("hello")', language: 'brainfuck', problemId: 'hello-world' });
    expect(result.success).toBe(false);
  });
});

describe('requirePermission middleware', () => {
  let requirePermission;

  beforeAll(async () => {
    requirePermission = require('../middleware/requirePermission');
  });

  it('returns 401 when no userId', async () => {
    const middleware = requirePermission('admin', 'manage');
    const { req, res } = mockReqRes({ userId: null });
    await middleware(req, res, () => {});
    expect(res.statusCode).toBe(401);
  });
});

describe('csrf middleware', () => {
  let csrf;

  beforeAll(async () => {
    csrf = require('../middleware/csrf');
  });

  it('exports csrfProtection and csrfToken functions', () => {
    expect(typeof csrf.csrfProtection).toBe('function');
    expect(typeof csrf.csrfToken).toBe('function');
  });
});
