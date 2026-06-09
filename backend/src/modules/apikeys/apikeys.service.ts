import { randomBytes } from 'node:crypto';
import { ApiKeyType, Role, type ApiKey } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { formatDate } from '../../lib/format.js';
import { HttpError } from '../../lib/http-error.js';
import type { CreateApiKeyInput } from './apikeys.schemas.js';

interface Principal {
  sub: string;
  role: Role;
}

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

export async function listApiKeys(principal: Principal) {
  const rows = await prisma.apiKey.findMany({
    where: principal.role === Role.ADMIN ? {} : { merchantId: principal.sub },
    orderBy: { createdAt: 'desc' },
  });
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

export async function deleteApiKey(id: string, principal: Principal) {
  const key = await prisma.apiKey.findUnique({ where: { id } });
  if (!key) throw HttpError.notFound('API key not found');
  if (principal.role !== Role.ADMIN && key.merchantId !== principal.sub) {
    throw HttpError.notFound('API key not found');
  }
  await prisma.apiKey.delete({ where: { id } });
}
