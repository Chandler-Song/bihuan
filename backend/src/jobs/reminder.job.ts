import cron from 'node-cron';
import { db } from '../db';
import { now, days, fmt } from '../utils/date';
import { newId } from '../utils/id';
import { logger } from '../config/logger';
import { withLock } from './lock';
import { sendMail, reminderMail } from '../services/mailer';
import type { TaskRow } from '../modules/tasks/tasks.service';

interface DueTask extends TaskRow {
  remind_email: string | null;
}

/**
 * 升级策略：
 *   remind_count(递增前) === 0 → 下一次 +3天
 *   remind_count(递增前) === 1 → 下一次 +1天
 *   remind_count(递增前) >= 2  → 下一次 +1天 (前端标红)
 */
function nextDelta(prev: number): number {
  if (prev === 0) return days(3);
  return days(1);
}

async function tick(): Promise<void> {
  const t = now();
  const rows = db
    .prepare(
      `SELECT t.*, uc.remind_email
       FROM tasks t
       LEFT JOIN user_configs uc ON uc.user_id = t.user_id
       WHERE t.status = 'pending' AND t.reminded = 0 AND t.next_remind_at <= ?
       LIMIT 200`
    )
    .all(t) as DueTask[];

  if (rows.length === 0) return;
  logger.info({ count: rows.length }, 'reminder due tasks');

  const insertLog = db.prepare(
    'INSERT INTO remind_logs(id, task_id, user_id, reminded_at, channel, action) VALUES (?,?,?,?,?,?)'
  );
  const updateTask = db.prepare(
    'UPDATE tasks SET remind_count = remind_count + 1, reminded = 1, next_remind_at = ? WHERE id = ?'
  );

  for (const row of rows) {
    const delta = nextDelta(row.remind_count);
    const next = now() + delta;
    updateTask.run(next, row.id);
    insertLog.run(newId(), row.id, row.user_id, now(), 'in_app', 'ignored');

    // 邮件提醒
    if (row.remind_email) {
      const m = reminderMail(row.content, row.remind_count + 1);
      sendMail({ to: row.remind_email, subject: m.subject, text: m.text, html: m.html })
        .then(() => insertLog.run(newId(), row.id, row.user_id, now(), 'email', 'ignored'))
        .catch((err) => logger.error({ err, taskId: row.id }, 'reminder mail failed'));
    }

    logger.debug({ id: row.id, next: fmt(next), level: row.remind_count + 1 }, 'reminded');
  }
}

export function startReminderJob(): void {
  cron.schedule('* * * * *', () => {
    withLock('reminder', 90, tick).catch((err) => logger.error({ err }, 'reminder job error'));
  });
  logger.info('reminder job scheduled (every minute)');
}
