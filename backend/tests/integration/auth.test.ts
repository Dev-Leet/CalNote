import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../../src/app';
import { UserModel } from '../../src/models/User.model';

let mongoServer: MongoMemoryServer;
const app = createApp();

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await UserModel.deleteMany({});
});

describe('POST /api/v1/auth/register', () => {
  it('registers a new user and returns an access token + user object', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'grandmaster@cp.com', password: 'strongPassword123' });

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe('grandmaster@cp.com');
    expect(res.body.user.passwordHash).toBeUndefined();

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.some((c: string) => c.startsWith('refreshToken='))).toBe(true);
  });

  it('rejects registration with a duplicate email (409 EMAIL_EXISTS)', async () => {
    await request(app).post('/api/v1/auth/register').send({ email: 'dup@cp.com', password: 'strongPassword123' });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'dup@cp.com', password: 'anotherPassword456' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('EMAIL_EXISTS');
  });

  it('rejects registration with a short password (400 VALIDATION_ERROR)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'short@cp.com', password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/v1/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/v1/auth/register').send({ email: 'login@cp.com', password: 'strongPassword123' });
  });

  it('logs in successfully with correct credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login@cp.com', password: 'strongPassword123' });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  it('rejects login with an incorrect password (401 INVALID_CREDENTIALS)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login@cp.com', password: 'wrongPassword' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });
});

describe('POST /api/v1/auth/refresh', () => {
  it('rotates the refresh token and issues a new access token', async () => {
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'refresh@cp.com', password: 'strongPassword123' });

    const cookie = registerRes.headers['set-cookie'][0];

    const refreshRes = await request(app).post('/api/v1/auth/refresh').set('Cookie', cookie);

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.accessToken).toBeDefined();
    expect(refreshRes.body.accessToken).not.toBe(registerRes.body.accessToken);
  });

  it('rejects refresh with no cookie present (401)', async () => {
    const res = await request(app).post('/api/v1/auth/refresh');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('REFRESH_TOKEN_INVALID_OR_REVOKED');
  });

  it('detects reuse of an already-rotated (revoked) refresh token', async () => {
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'reuse@cp.com', password: 'strongPassword123' });

    const originalCookie = registerRes.headers['set-cookie'][0];

    // First refresh rotates the token — this should succeed
    await request(app).post('/api/v1/auth/refresh').set('Cookie', originalCookie);

    // Reusing the now-revoked original cookie should fail
    const reuseRes = await request(app).post('/api/v1/auth/refresh').set('Cookie', originalCookie);

    expect(reuseRes.status).toBe(401);
    expect(reuseRes.body.code).toBe('REFRESH_TOKEN_INVALID_OR_REVOKED');
  });
});
