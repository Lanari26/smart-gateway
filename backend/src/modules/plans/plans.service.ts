import { PlanCycle, type Plan } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import type { CreatePlanInput } from './plans.schemas.js';

const CYCLE_TO_DTO: Record<PlanCycle, 'Monthly' | 'Quarterly' | 'Yearly'> = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  YEARLY: 'Yearly',
};

const CYCLE_FROM_DTO: Record<'Monthly' | 'Quarterly' | 'Yearly', PlanCycle> = {
  Monthly: PlanCycle.MONTHLY,
  Quarterly: PlanCycle.QUARTERLY,
  Yearly: PlanCycle.YEARLY,
};

function toDTO(p: Plan) {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    cycle: CYCLE_TO_DTO[p.cycle],
    subscribers: p.subscribers,
    description: p.description,
    isPopular: p.isPopular,
    isScalable: p.isScalable,
  };
}

export async function listPlans() {
  const rows = await prisma.plan.findMany({ orderBy: { price: 'asc' } });
  return rows.map(toDTO);
}

export async function createPlan(input: CreatePlanInput) {
  const plan = await prisma.plan.create({
    data: {
      name: input.name,
      price: input.price,
      cycle: CYCLE_FROM_DTO[input.cycle],
      description: input.description,
      subscribers: input.subscribers ?? 0,
      isPopular: input.isPopular ?? false,
      isScalable: input.isScalable ?? false,
    },
  });
  return toDTO(plan);
}

export async function deletePlan(id: string) {
  await prisma.plan.delete({ where: { id } });
}
