import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth';
import { ok } from '../../middleware/error';
import { Errors } from '../../utils/errors';
import { db } from '../../db';

const ConfigSchema = z.object({
  remind_email: z.string().email().optional(),
  daily_remind_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  weekly_report: z.boolean().optional(),
  monthly_report: z.boolean().optional(),
});

const router = Router();
router.use(requireAuth);

router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw Errors.unauthorized();
    const row = db
      .prepare('SELECT * FROM user_configs WHERE user_id = ?')
      .get(req.user.sub);
    ok(res, row || {});
  } catch (e) {
    next(e);
  }
});

router.put('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw Errors.unauthorized();
    const body = ConfigSchema.parse(req.body);
    const sets: string[] = [];
    const args: (string | number)[] = [];
    if (body.remind_email !== undefined) {
      sets.push('remind_email = ?');
      args.push(body.remind_email);
    }
    if (body.daily_remind_time !== undefined) {
      sets.push('daily_remind_time = ?');
      args.push(body.daily_remind_time);
    }
    if (body.weekly_report !== undefined) {
      sets.push('weekly_report = ?');
      args.push(body.weekly_report ? 1 : 0);
    }
    if (body.monthly_report !== undefined) {
      sets.push('monthly_report = ?');
      args.push(body.monthly_report ? 1 : 0);
    }
    if (sets.length > 0) {
      args.push(req.user.sub);
      db.prepare(`UPDATE user_configs SET ${sets.join(', ')} WHERE user_id = ?`).run(...args);
    }
    const row = db
      .prepare('SELECT * FROM user_configs WHERE user_id = ?')
      .get(req.user.sub);
    ok(res, row);
  } catch (e) {
    next(e);
  }
});

export default router;
