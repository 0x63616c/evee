// Public API re-exports — the actual definitions live in schema.ts to avoid
// circular imports that break drizzle-kit's CJS module resolver.
export { publicTable, userTable } from './schema.js';
