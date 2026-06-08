import { z } from 'zod';

/**
 * Validated, typed environment. Fails fast at boot if required vars are missing
 * so we never run a half-configured server.
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_ACCESS_SECRET: z.string().min(8, 'JWT_ACCESS_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(8, 'JWT_REFRESH_SECRET is required'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),

  // Comma-separated list of allowed frontend origins.
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
