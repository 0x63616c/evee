import { $ } from 'bun';
import { seed } from './src/db/seed.js';

console.log('Running migrations...');
await $`bunx drizzle-kit migrate`;

console.log('Running seed...');
await seed();

console.log('Starting server...');
await import('./src/index.js');
