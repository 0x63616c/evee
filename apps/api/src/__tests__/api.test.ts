import { describe, expect, it } from 'vitest';
import { appRouter } from '../routers/index.js';
import { createContext } from '../trpc.js';

const caller = appRouter.createCaller({ user: null });

describe('auth', () => {
  it('register returns a token', async () => {
    const result = await caller.auth.register({
      email: `test-${Date.now()}@example.com`,
      password: 'password123',
    });
    expect(result.token).toBeDefined();
  });

  it('login returns a token', async () => {
    const email = `test-${Date.now()}@example.com`;
    await caller.auth.register({ email, password: 'password123' });
    const result = await caller.auth.login({ email, password: 'password123' });
    expect(result.token).toBeDefined();
  });

  it('login with wrong password returns UNAUTHORIZED', async () => {
    const email = `test-${Date.now()}@example.com`;
    await caller.auth.register({ email, password: 'password123' });
    await expect(
      caller.auth.login({ email, password: 'wrongpassword' }),
    ).rejects.toThrow('Invalid email or password');
  });
});

describe('user.me', () => {
  it('returns the user when authenticated', async () => {
    const email = `test-${Date.now()}@example.com`;
    const { token } = await caller.auth.register({
      email,
      password: 'password123',
    });

    // Create an authenticated caller by simulating context with a valid JWT
    const req = new Request('http://localhost', {
      headers: { authorization: `Bearer ${token}` },
    });
    const ctx = await createContext({ req });
    const authedCaller = appRouter.createCaller(ctx);

    const me = await authedCaller.user.me();
    expect(me.email).toBe(email);
  });

  it('returns UNAUTHORIZED without a token', async () => {
    await expect(caller.user.me()).rejects.toThrow('You must be logged in');
  });
});
