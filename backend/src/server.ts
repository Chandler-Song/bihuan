import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { migrate } from './db';
import { startReminderJob } from './jobs/reminder.job';
import { startWeeklyJob, startMonthlyJob, startCleanupJob } from './jobs/report.job';

async function main(): Promise<void> {
  migrate();
  const app = createApp();
  app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'bihuan backend started');
  });

  startReminderJob();
  startWeeklyJob();
  startMonthlyJob();
  startCleanupJob();
}

main().catch((err) => {
  logger.fatal({ err }, 'bootstrap failed');
  process.exit(1);
});
