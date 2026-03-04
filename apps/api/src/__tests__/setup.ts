import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

// Polyfill Bun.password for vitest (which runs under Node.js, not Bun)
if (typeof Bun === 'undefined') {
  // biome-ignore lint/suspicious/noExplicitAny: polyfilling globalThis.Bun under Node.js for vitest
  (globalThis as any).Bun = {
    password: {
      async hash(password: string): Promise<string> {
        const salt = randomBytes(16).toString('hex');
        const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
        return `${salt}:${derivedKey.toString('hex')}`;
      },
      async verify(password: string, hash: string): Promise<boolean> {
        const [salt, storedKey] = hash.split(':');
        const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
        const storedKeyBuffer = Buffer.from(storedKey, 'hex');
        return timingSafeEqual(derivedKey, storedKeyBuffer);
      },
    },
  };
}
