import cron from 'node-cron';
import { db } from '../db';
import { logger } from '../config/logger';
import { withLock } from './lock';
import { sendMail, summaryMail } from '../services/mailer';
import { computeStats } from '../modules/summary/summary.service';
import { generateAISummary, SummaryStats } from '../services/qwen';

interface UserMail {
  user_id: string;
  email: string;
  remind_email: string | null;
  weekly_report: number;
  monthly_report: number;
}

function buildHtml(period: 'week' | 'month', stats: SummaryStats, ai: string): string {
  const periodCN = period === 'week' ? '本周' : '本月';
  return `
    <h2>${periodCN}闭环总结</h2>
    <ul>
      <li>新增任务：${stats.newCount}</li>
      <li>闭环任务：${stats.closedCount}</li>
      <li>闭环率：${(stats.closeRate * 100).toFixed(0)}%</li>
      <li>当前待处理：${stats.pendingCount}</li>
      <li>逾期：${stats.overdueCount}</li>
      <li>平均闭环天数：${stats.avgClosedDays}</li>
    </ul>
    <h3>AI 点评</h3>
    <p>${ai.replace(/\n/g, '<br/>')}</p>
    <p style="color:#888">—— 闭环</p>
  `;
}

async function runReports(period: 'week' | 'month'): Promise<void> {
  const flag = period === 'week' ? 'weekly_report' : 'monthly_report';
  const users = db
    .prepare(
      `SELECT u.id AS user_id, u.email, uc.remind_email, uc.weekly_report, uc.monthly_report
       FROM users u LEFT JOIN user_configs uc ON uc.user_id = u.id
       WHERE COALESCE(uc.${flag}, 1) = 1`
    )
    .all() as UserMail[];

  logger.info({ period, count: users.length }, 'send periodic summary');

  for (const u of users) {
    try {
      const stats = computeStats(u.user_id, period);
      const ai = await generateAISummary(period, stats);
      const html = buildHtml(period, stats, ai);
      const m = summaryMail(period, html);
      await sendMail({ to: u.remind_email || u.email, subject: m.subject, html: m.html });
    } catch (err) {
      logger.error({ err, userId: u.user_id }, 'periodic summary failed');
    }
  }
}

export function startWeeklyJob(): void {
  cron.schedule('0 9 * * 1', () => {
    withLock('weekly', 600, () => runReports('week')).catch((err) =>
      logger.error({ err }, 'weekly job error')
    );
  });
  logger.info('weekly job scheduled (Mon 09:00)');
}

export function startMonthlyJob(): void {
  cron.schedule('0 9 1 * *', () => {
    withLock('monthly', 1200, () => runReports('month')).catch((err) =>
      logger.error({ err }, 'monthly job error')
    );
  });
  logger.info('monthly job scheduled (1st 09:00)');
}

export function startCleanupJob(): void {
  cron.schedule('0 3 * * *', () => {
    withLock('cleanup', 600, async () => {
      const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const r = db.prepare('DELETE FROM remind_logs WHERE reminded_at < ?').run(cutoff);
      logger.info({ deleted: r.changes }, 'remind_logs cleaned');
    }).catch((err) => logger.error({ err }, 'cleanup job error'));
  });
  logger.info('cleanup job scheduled (daily 03:00)');
}
