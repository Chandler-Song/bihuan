import { db } from '../../db';
import { rangeOf, now } from '../../utils/date';
import { generateAISummary, SummaryStats } from '../../services/qwen';

export function computeStats(userId: string, period: 'week' | 'month'): SummaryStats {
  const [s, e] = rangeOf(period);

  const newCount = (db
    .prepare('SELECT COUNT(*) c FROM tasks WHERE user_id = ? AND created_at BETWEEN ? AND ?')
    .get(userId, s, e) as { c: number }).c;

  const closedCount = (db
    .prepare('SELECT COUNT(*) c FROM tasks WHERE user_id = ? AND closed_at BETWEEN ? AND ?')
    .get(userId, s, e) as { c: number }).c;

  const pendingCount = (db
    .prepare("SELECT COUNT(*) c FROM tasks WHERE user_id = ? AND status = 'pending'")
    .get(userId) as { c: number }).c;

  const overdueCount = (db
    .prepare(
      "SELECT COUNT(*) c FROM tasks WHERE user_id = ? AND status = 'pending' AND next_remind_at < ?"
    )
    .get(userId, now()) as { c: number }).c;

  const avgRow = db
    .prepare(
      `SELECT AVG((closed_at - created_at) * 1.0 / 86400000) avg
       FROM tasks WHERE user_id = ? AND closed_at BETWEEN ? AND ?`
    )
    .get(userId, s, e) as { avg: number | null };

  const longPending = db
    .prepare(
      `SELECT content, ((? - created_at) / 86400000) AS days
       FROM tasks
       WHERE user_id = ? AND status = 'pending' AND created_at < ?
       ORDER BY created_at ASC LIMIT 5`
    )
    .all(now(), userId, now() - 14 * 86400000) as { content: string; days: number }[];

  const closeRate = newCount === 0 ? 0 : Math.min(1, closedCount / newCount);
  return {
    newCount,
    closedCount,
    closeRate,
    pendingCount,
    overdueCount,
    avgClosedDays: Math.round((avgRow.avg ?? 0) * 10) / 10,
    longPending,
  };
}

export async function generateSummaryText(
  userId: string,
  period: 'week' | 'month'
): Promise<{ stats: SummaryStats; text: string }> {
  const stats = computeStats(userId, period);
  const text = await generateAISummary(period, stats);
  return { stats, text };
}
