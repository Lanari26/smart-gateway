import { randomBytes } from 'node:crypto';
import { ApiKeyType, type ApiKey } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { formatDate } from '../../lib/format.js';
import type { CreateApiKeyInput } from './apikeys.schemas.js';

function toDTO(k: ApiKey) {
  return {
    id: k.id,
    label: k.label,
    type: k.type, // 'PUBLIC' | 'SECRET'
    token: k.token,
    created: formatDate(k.createdAt),
  };
}

/** Generates a Stripe-style key token, e.g. pk_live_xx…, sk_test_xx… */
function generateToken(type: ApiKeyType, mode: 'live' | 'test'): string {
  const prefix = type === ApiKeyType.SECRET ? 'sk' : 'pk';
  const body = randomBytes(24).toString('base64url').replace(/[^a-zA-Z0-9]/g, '').slice(0, 40);
  return `${prefix}_${mode}_${body}`;
}

export async function listApiKeys() {
  const rows = await prisma.apiKey.findMany({ orderBy: { createdAt: 'desc' } });
  return rows.map(toDTO);
}

export async function createApiKey(input: CreateApiKeyInput, merchantId?: string) {
  const type = input.type as ApiKeyType;
  const key = await prisma.apiKey.create({
    data: {
      label: input.label,
      type,
      token: generateToken(type, input.mode),
      merchantId: merchantId ?? null,
    },
  });
  return toDTO(key);
}

export async function deleteApiKey(id: string) {
  await prisma.apiKey.delete({ where: { id } });
}
