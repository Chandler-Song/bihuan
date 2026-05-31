import { db } from '../../db';
import { newId } from '../../utils/id';
import { now, days, todayRange, toMs } from '../../utils/date';
import { Errors } from '../../utils/errors';
import { parseTaskByAI } from '../../services/qwen';
import type { ListTaskQuery } from './tasks.schema';

export interface TaskRow {
  id: string;
  user_id: string;
  content: string;
  priority: 'high' | 'normal' | 'low';
  status: 'pending' | 'done';
  created_at: number;
  next_remind_at: number;
  remind_count: number;
  reminded: 0 | 1;
  snoozed_until: number | null;
  closed_at: number | null;
  note: string;
  tags?: string[];
}

const ENCOURAGES = [
  '又闭环一件，干得漂亮！',
  '稳扎稳打，越来越接近目标。',
  '完成胜过完美，继续保持节奏。',
  '一件接一件，问题不再堆积。',
  '小步快跑，是最有效的节奏。',
];

function pickEncourage(): string {
  return ENCOURAGES[Math.floor(Math.random() * ENCOURAGES.length)];
}

export async function createTask(userId: string, input: string): Promise<TaskRow> {
  const parsed = await parseTaskByAI(input);
  const id = newId();
  const created = now();
  const nextRemind = created + days(parsed.remindDays);

  db.transaction(() => {
    db.prepare(
      `INSERT INTO tasks(id, user_id, content, priority, status, created_at, next_remind_at, remind_count, reminded, note)
       VALUES (?, ?, ?, ?, 'pending', ?, ?, 0, 0, '')`
    ).run(id, userId, parsed.content, parsed.priority, created, nextRemind);

    // 处理标签
    for (const tagName of parsed.tags) {
      let tag = db.prepare('SELECT id FROM tags WHERE user_id = ? AND name = ?').get(userId, tagName) as { id: string } | undefined;
      if (!tag) {
        const tagId = newId();
        db.prepare('INSERT INTO tags(id, user_id, name, created_at) VALUES (?, ?, ?, ?)').run(tagId, userId, tagName, created);
        tag = { id: tagId };
      }
      db.prepare('INSERT OR IGNORE INTO task_tags(task_id, tag_id) VALUES (?, ?)').run(id, tag.id);
    }
  })();

  return getById(userId, id)!;
}

export function getById(userId: string, id: string): TaskRow | undefined {
  const row = db
    .prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?')
    .get(id, userId) as TaskRow | undefined;
  if (!row) return undefined;
  const tags = (db.prepare(
    `SELECT t.name FROM tags t JOIN task_tags tt ON t.id = tt.tag_id WHERE tt.task_id = ?`
  ).all(id) as any[]).map((r) => r.name);
  return { ...row, tags };
}

export function assertOwner(userId: string, id: string): TaskRow {
  const row = getById(userId, id);
  if (!row) throw Errors.notFound('任务不存在');
  return row;
}

export interface PatchInput {
  status?: 'pending' | 'done';
  snoozeDays?: number;
  content?: string;
  priority?: 'high' | 'normal' | 'low';
  note?: string;
  seen?: boolean;
  next_remind_at?: number;
  tags?: string[];
}

export function patchTask(userId: string, id: string, input: PatchInput): { task: TaskRow; encourage?: string } {
  const row = assertOwner(userId, id);
  const sets: string[] = [];
  const args: (string | number | null)[] = [];
  let encourage: string | undefined;

  if (input.content !== undefined) {
    sets.push('content = ?');
    args.push(input.content);
  }
  if (input.priority !== undefined) {
    sets.push('priority = ?');
    args.push(input.priority);
  }
  if (input.note !== undefined) {
    sets.push('note = ?');
    args.push(input.note);
  }
  if (input.snoozeDays !== undefined) {
    sets.push('next_remind_at = ?');
    args.push(now() + days(input.snoozeDays));
    sets.push('reminded = 0');
    sets.push('snoozed_until = ?');
    args.push(now() + days(input.snoozeDays));
  }
  if (input.seen) {
    sets.push('reminded = 0');
  }
  if (input.status === 'done' && row.status !== 'done') {
    sets.push("status = 'done'");
    sets.push('closed_at = ?');
    args.push(now());
    sets.push('reminded = 1');
    encourage = pickEncourage();
  }
  if (input.status === 'pending' && row.status === 'pending') {
    // no-op
  }
  if (input.next_remind_at !== undefined) {
    sets.push('next_remind_at = ?');
    args.push(input.next_remind_at);
    sets.push('reminded = 0');
  }

  if (sets.length === 0 && input.tags === undefined) return { task: row };

  db.transaction(() => {
    // 标签更新（先删后增）
    if (input.tags !== undefined) {
      db.prepare('DELETE FROM task_tags WHERE task_id = ?').run(id);
      for (const tagName of input.tags) {
        let tag = db.prepare('SELECT id FROM tags WHERE user_id = ? AND name = ?').get(userId, tagName) as { id: string } | undefined;
        if (!tag) {
          const tagId = newId();
          db.prepare('INSERT INTO tags(id, user_id, name, created_at) VALUES (?, ?, ?, ?)').run(tagId, userId, tagName, now());
          tag = { id: tagId };
        }
        db.prepare('INSERT OR IGNORE INTO task_tags(task_id, tag_id) VALUES (?, ?)').run(id, tag.id);
      }
    }

    if (sets.length > 0) {
      args.push(id, userId);
      db.prepare(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`).run(...args);
    }
  })();

  return { task: getById(userId, id)!, encourage };
}

export function deleteTask(userId: string, id: string): void {
  assertOwner(userId, id);
  db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(id, userId);
}

export function listTasks(userId: string, q: ListTaskQuery): {
  list: TaskRow[];
  total: number;
  page: number;
  pageSize: number;
} {
  const conds: string[] = ['user_id = ?'];
  const args: (string | number)[] = [userId];

  if (q.status && q.status !== 'all') {
    conds.push('status = ?');
    args.push(q.status);
  }
  if (q.keyword) {
    conds.push('LOWER(content) LIKE ?');
    args.push(`%${q.keyword.toLowerCase()}%`);
  }
  if (q.view === 'today') {
    const [s, e] = todayRange();
    conds.push("status = 'pending' AND next_remind_at BETWEEN ? AND ?");
    args.push(s, e);
  } else if (q.startDate && q.endDate) {
    const colMap: Record<'created' | 'remind' | 'closed', string> = {
      created: 'created_at',
      remind: 'next_remind_at',
      closed: 'closed_at',
    };
    const col = colMap[q.dateField || 'created'];
    conds.push(`${col} BETWEEN ? AND ?`);
    args.push(toMs(q.startDate), toMs(q.endDate, true));
  }

  if (q.tag) {
    conds.push(`id IN (SELECT task_id FROM task_tags WHERE tag_id IN (SELECT id FROM tags WHERE user_id = ? AND name = ?))`);
    args.push(userId, q.tag);
  }

  const where = conds.join(' AND ');
  const total = (db
    .prepare(`SELECT COUNT(*) as c FROM tasks WHERE ${where}`)
    .get(...args) as { c: number }).c;

  const offset = (q.page - 1) * q.pageSize;
  const sortColMap: Record<string, string> = {
    created: 'created_at',
    remind: 'next_remind_at',
    priority: "CASE priority WHEN 'high' THEN 1 WHEN 'normal' THEN 2 WHEN 'low' THEN 3 END",
    tag: '(SELECT COUNT(*) FROM task_tags WHERE task_id = tasks.id)',
  };
  const sortCol = sortColMap[q.sortBy || 'remind'];
  const sortDir = q.sortOrder === 'desc' ? 'DESC' : 'ASC';

  const list = db
    .prepare(
      `SELECT * FROM tasks WHERE ${where}
       ORDER BY (status='pending') DESC, ${sortCol} ${sortDir}
       LIMIT ? OFFSET ?`
    )
    .all(...args, q.pageSize, offset) as TaskRow[];

  return { list, total, page: q.page, pageSize: q.pageSize };
}

export function getUserTags(userId: string): string[] {
  return (db.prepare('SELECT name FROM tags WHERE user_id = ? ORDER BY name').all(userId) as any[]).map((r) => r.name);
}
