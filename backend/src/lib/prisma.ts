import { PrismaClient } from '@prisma/client';
import { isProd } from '../env.js';

/**
 * Single shared Prisma client. In dev, guard against multiple instances when
 * tsx watch reloads the module.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isProd ? ['error'] : ['query', 'warn', 'error'],
  });

if (!isProd) globalForPrisma.prisma = prisma;
