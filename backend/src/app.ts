import express, { Application } from 'express';
import cors from 'cors';
import authRoute from './modules/auth/auth.route';
import tasksRoute from './modules/tasks/tasks.route';
import summaryRoute from './modules/summary/summary.route';
import configRoute from './modules/config/config.route';
import healthRoute from './modules/health/health.route';
import { errorHandler, notFound } from './middleware/error';
import { globalLimiter } from './middleware/rateLimit';

export function createApp(): Application {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors());
  app.use(express.json({ limit: '256kb' }));
  app.use(globalLimiter);

  app.use('/health', healthRoute);
  app.use('/api/auth', authRoute);
  app.use('/api/tasks', tasksRoute);
  app.use('/api/summary', summaryRoute);
  app.use('/api/config', configRoute);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
