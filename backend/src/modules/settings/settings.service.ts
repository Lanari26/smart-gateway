import { type GatewaySettings } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import type { UpdateSettingsInput } from './settings.schemas.js';

const SINGLETON = 'singleton';

function toDTO(s: GatewaySettings) {
  return {
    feeMarkup: s.feeMarkup,
    routingPreference: s.routingPreference,
    simulationSpeed: s.simulationSpeed,
  };
}

/** Returns the single settings row, creating it with defaults on first access. */
export async function getSettings() {
  const settings = await prisma.gatewaySettings.upsert({
    where: { id: SINGLETON },
    update: {},
    create: { id: SINGLETON },
  });
  return toDTO(settings);
}

export async function updateSettings(input: UpdateSettingsInput) {
  const settings = await prisma.gatewaySettings.upsert({
    where: { id: SINGLETON },
    update: input,
    create: { id: SINGLETON, ...input },
  });
  return toDTO(settings);
}
