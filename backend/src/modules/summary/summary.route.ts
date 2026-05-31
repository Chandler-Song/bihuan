import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth';
import { ok } from '../../middleware/error';
import { Errors } from '../../utils/errors';
import { computeStats, generateSummaryText } from './summary.service';

const PeriodSchema = z.object({
  period: z.enum(['week', 'month']).optional().default('week'),
});

const router = Router();
router.use(requireAuth);

router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period } = PeriodSchema.parse(req.query);
    if (!req.user) throw Errors.unauthorized();
    ok(res, computeStats(req.user.sub, period));
  } catch (e) {
    next(e);
  }
});

router.post('/ai', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period } = PeriodSchema.parse(req.query);
    if (!req.user) throw Errors.unauthorized();
    const r = await generateSummaryText(req.user.sub, period);
    ok(res, r);
  } catch (e) {
    next(e);
  }
});

export default router;
