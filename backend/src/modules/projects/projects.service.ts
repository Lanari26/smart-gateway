import { ProjectStatus, type Project } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import type { CreateProjectInput } from './projects.schemas.js';

const STATUS_TO_DTO: Record<ProjectStatus, 'active' | 'configuring'> = {
  ACTIVE: 'active',
  CONFIGURING: 'configuring',
};

function toDTO(p: Project) {
  return {
    id: p.id,
    name: p.name,
    webhookUrl: p.webhookUrl,
    keysCreated: p.keysCreated,
    totalCalls: p.totalCalls,
    status: STATUS_TO_DTO[p.status],
  };
}

export async function listProjects() {
  const rows = await prisma.project.findMany({ orderBy: { createdAt: 'asc' } });
  return rows.map(toDTO);
}

export async function createProject(input: CreateProjectInput) {
  const project = await prisma.project.create({
    data: {
      name: input.name,
      webhookUrl: input.webhookUrl ?? '',
      keysCreated: 1,
      totalCalls: 0,
      status: ProjectStatus.CONFIGURING,
    },
  });
  return toDTO(project);
}

export async function deleteProject(id: string) {
  await prisma.project.delete({ where: { id } });
}
