import { SubscriptionStatus, type Subscription } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../lib/http-error.js';
import type { CreateSubscriptionInput } from './subscriptions.schemas.js';

const STATUS_TO_DTO: Record<SubscriptionStatus, 'Active' | 'Pending' | 'Cancelled'> = {
  ACTIVE: 'Active',
  PENDING: 'Pending',
  CANCELLED: 'Cancelled',
};

const STATUS_FROM_DTO: Record<'Active' | 'Pending' | 'Cancelled', SubscriptionStatus> = {
  Active: SubscriptionStatus.ACTIVE,
  Pending: SubscriptionStatus.PENDING,
  Cancelled: SubscriptionStatus.CANCELLED,
};

// Stable avatar colour palette (Tailwind classes the frontend already uses).
const AVATAR_COLORS = [
  'bg-emerald-500/20 text-emerald-400',
  'bg-blue-500/20 text-blue-400',
  'bg-pink-500/20 text-pink-400',
  'bg-purple-500/20 text-purple-400',
  'bg-amber-500/20 text-amber-400',
  'bg-rose-500/20 text-rose-400',
];

function colorFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function toDTO(s: Subscription) {
  return {
    id: s.id,
    name: s.name,
    email: s.email,
    planName: s.planName,
    status: STATUS_TO_DTO[s.status],
    nextBilling: s.nextBilling ?? 'N/A',
    amount: s.amount,
    avatarColor: colorFor(s.email || s.name),
  };
}

export async function listSubscriptions() {
  const rows = await prisma.subscription.findMany({ orderBy: { createdAt: 'desc' } });
  return rows.map(toDTO);
}

export async function createSubscription(input: CreateSubscriptionInput) {
  const sub = await prisma.subscription.create({
    data: {
      name: input.name,
      email: input.email,
      planName: input.planName,
      amount: input.amount,
      nextBilling: input.nextBilling ?? null,
      status: input.status ? STATUS_FROM_DTO[input.status] : SubscriptionStatus.ACTIVE,
    },
  });
  return toDTO(sub);
}

export async function cancelSubscription(id: string) {
  const current = await prisma.subscription.findUnique({ where: { id } });
  if (!current) throw HttpError.notFound('Subscription not found');
  const sub = await prisma.subscription.update({
    where: { id },
    data: { status: SubscriptionStatus.CANCELLED, amount: 0, nextBilling: null },
  });
  return toDTO(sub);
}
