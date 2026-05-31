import { Request, Response, NextFunction } from 'express';
import { ok } from '../../middleware/error';
import { Errors } from '../../utils/errors';
import {
  CreateTaskSchema,
  PatchTaskSchema,
  ListTaskQuerySchema,
} from './tasks.schema';
import {
  createTask,
  patchTask,
  deleteTask,
  listTasks,
  getById,
  getUserTags,
} from './tasks.service';

function uid(req: Request): string {
  if (!req.user) throw Errors.unauthorized();
  return req.user.sub;
}

export async function postCreate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { input } = CreateTaskSchema.parse(req.body);
    const task = await createTask(uid(req), input);
    ok(res, task);
  } catch (e) {
    next(e);
  }
}

export function getList(req: Request, res: Response, next: NextFunction): void {
  try {
    const q = ListTaskQuerySchema.parse(req.query);
    const data = listTasks(uid(req), q);
    ok(res, data);
  } catch (e) {
    next(e);
  }
}

export function getOne(req: Request, res: Response, next: NextFunction): void {
  try {
    const t = getById(uid(req), req.params.id);
    if (!t) throw Errors.notFound('任务不存在');
    ok(res, t);
  } catch (e) {
    next(e);
  }
}

export function patchOne(req: Request, res: Response, next: NextFunction): void {
  try {
    const body = PatchTaskSchema.parse(req.body);
    const r = patchTask(uid(req), req.params.id, body);
    ok(res, r);
  } catch (e) {
    next(e);
  }
}

export function deleteOne(req: Request, res: Response, next: NextFunction): void {
  try {
    deleteTask(uid(req), req.params.id);
    ok(res, { deleted: true });
  } catch (e) {
    next(e);
  }
}

export function getTags(req: Request, res: Response, next: NextFunction): void {
  try {
    const tags = getUserTags(uid(req));
    ok(res, { tags });
  } catch (e) {
    next(e);
  }
}
