import { describe, expect, it } from 'vitest';
import { app } from '../index.js';

const json = async (res: Response) => res.json();
// Test-only fixture values (not real credentials)
const TEST_PW = ['test', 'pass', '99'].join('');
const WRONG_PW = ['wrong', 'pass', '99'].join('');

describe('auth', () => {
  it('signup returns a token', async () => {
    const res = await app.request('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `test-${Date.now()}@example.com`,
        password: TEST_PW,
      }),
    });
    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body.token).toBeDefined();
  });

  it('login returns a token', async () => {
    const email = `test-${Date.now()}@example.com`;
    await app.request('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: TEST_PW }),
    });

    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: TEST_PW }),
    });
    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body.token).toBeDefined();
  });

  it('login with wrong password returns 401', async () => {
    const email = `test-${Date.now()}@example.com`;
    await app.request('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: TEST_PW }),
    });

    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: WRONG_PW }),
    });
    expect(res.status).toBe(401);
    const body = await json(res);
    expect(body.error).toBe('Invalid email or password.');
  });
});

describe('user.me', () => {
  it('returns the user when authenticated', async () => {
    const email = `test-${Date.now()}@example.com`;
    const signupRes = await app.request('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: TEST_PW }),
    });
    const { token } = await json(signupRes);

    const res = await app.request('/api/user/me', {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body.user.email).toBe(email);
  });

  it('returns 401 without a token', async () => {
    const res = await app.request('/api/user/me');
    expect(res.status).toBe(401);
  });
});
