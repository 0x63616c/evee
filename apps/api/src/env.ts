import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(1),
  OPENROUTER_API_KEY: z.string().min(1).optional(),
  PORT: z.coerce.number().default(4201),
});

export const env = envSchema.parse(process.env);
