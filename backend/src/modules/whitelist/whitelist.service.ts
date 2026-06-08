import { type WhitelistedIp } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import type { CreateIpInput } from './whitelist.schemas.js';

function toDTO(i: WhitelistedIp) {
  return { id: i.id, ip: i.ip, label: i.label };
}

export async function listIps() {
  const rows = await prisma.whitelistedIp.findMany({ orderBy: { createdAt: 'asc' } });
  return rows.map(toDTO);
}

export async function createIp(input: CreateIpInput) {
  const ip = await prisma.whitelistedIp.create({ data: { ip: input.ip, label: input.label } });
  return toDTO(ip);
}

export async function deleteIp(id: string) {
  await prisma.whitelistedIp.delete({ where: { id } });
}
