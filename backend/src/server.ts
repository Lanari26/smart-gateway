import { createApp } from './app.js';
import { env } from './env.js';
import { prisma } from './lib/prisma.js';

async function main() {
  await prisma.$connect();

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`🚀 SmartPay Gateway API listening on :${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received — shutting down...`);
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
