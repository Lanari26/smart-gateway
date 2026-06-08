import { randomUUID } from 'node:crypto';
import { type Merchant } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { hashPassword, verifyPassword } from '../../lib/password.js';
import { HttpError } from '../../lib/http-error.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from './tokens.js';
import type { LoginInput, RegisterInput } from './auth.schemas.js';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** Normalises a phone number for storage and lookup: keeps a leading + and digits. */
function normalizePhone(value: string): string {
  const trimmed = value.trim();
  const plus = trimmed.startsWith('+') ? '+' : '';
  return plus + trimmed.replace(/\D/g, '');
}

function publicMerchant(m: Merchant) {
  return {
    id: m.id,
    email: m.email,
    name: m.name,
    businessName: m.businessName,
    phone: m.phone,
    role: m.role,
    createdAt: m.createdAt,
  };
}

async function issueTokens(merchant: Merchant): Promise<AuthTokens> {
  const tokenId = randomUUID();
  await prisma.refreshToken.create({
    data: {
      id: tokenId,
      merchantId: merchant.id,
      // Mirror JWT_REFRESH_TTL; pruning of expired rows happens lazily.
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return {
    accessToken: signAccessToken({ sub: merchant.id, role: merchant.role, email: merchant.email }),
    refreshToken: signRefreshToken(merchant.id, tokenId),
  };
}

export async function register(input: RegisterInput) {
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.merchant.findUnique({ where: { email } });
  if (existing) throw HttpError.conflict('An account with this email already exists');

  const merchant = await prisma.merchant.create({
    data: {
      email,
      name: input.name,
      businessName: input.businessName ?? null,
      phone: input.phone ? normalizePhone(input.phone) : null,
      passwordHash: await hashPassword(input.password),
    },
  });

  const tokens = await issueTokens(merchant);
  return { user: publicMerchant(merchant), ...tokens };
}

export async function login(input: LoginInput) {
  const id = input.identifier.trim();
  const phone = normalizePhone(id);
  const merchant = await prisma.merchant.findFirst({
    where: {
      OR: [
        { email: id.toLowerCase() },
        ...(phone.replace('+', '').length >= 7 ? [{ phone }] : []),
      ],
    },
  });
  // Constant-ish failure path — same error whether user missing or bad password.
  if (!merchant || !(await verifyPassword(input.password, merchant.passwordHash))) {
    throw HttpError.unauthorized('Wrong email, phone, or password');
  }

  const tokens = await issueTokens(merchant);
  return { user: publicMerchant(merchant), ...tokens };
}

export async function refresh(refreshToken: string) {
  let payload: { sub: string; jti: string };
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw HttpError.unauthorized('Invalid refresh token');
  }

  const stored = await prisma.refreshToken.findUnique({ where: { id: payload.jti } });
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw HttpError.unauthorized('Refresh token expired or revoked');
  }

  const merchant = await prisma.merchant.findUnique({ where: { id: payload.sub } });
  if (!merchant) throw HttpError.unauthorized('Account no longer exists');

  // Rotate: revoke the used token, mint a fresh pair.
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const tokens = await issueTokens(merchant);
  return { user: publicMerchant(merchant), ...tokens };
}

export async function logout(refreshToken: string) {
  try {
    const { jti } = verifyRefreshToken(refreshToken);
    await prisma.refreshToken.updateMany({
      where: { id: jti, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  } catch {
    // Already invalid — nothing to revoke.
  }
}

export async function me(merchantId: string) {
  const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
  if (!merchant) throw HttpError.notFound('Account not found');
  return publicMerchant(merchant);
}
