import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { authenticate } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { createProjectSchema } from './projects.schemas.js';
import * as service from './projects.service.js';

export const projectsRouter = Router();

projectsRouter.use(authenticate);

projectsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json({ projects: await service.listProjects() });
  }),
);

projectsRouter.post(
  '/',
  validateBody(createProjectSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json({ project: await service.createProject(req.body) });
  }),
);

projectsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await service.deleteProject(req.params.id);
    res.status(204).end();
  }),
);
