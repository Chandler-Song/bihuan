import { redis } from '../../redis';
import { db } from '../../db';
import { now } from '../../utils/date';
import { newId } from '../../utils/id';
import { hashPassword, comparePassword } from '../../utils/password';
import { signToken } from '../../utils/jwt';
import { Errors } from '../../utils/errors';
import { sendMail, verifyCodeMail } from '../../services/mailer';
import dayjs from 'dayjs';

export interface UserRow {
  id: string;
  email: string;
  password: string | null;
  created_at: number;
}

const codeKey = (email: string): string => `verify_code:${email}`;
const lockKey = (email: string): string => `code_send_lock:${email}`;
const quotaKey = (email: string): string =>
  `code_send_quota:${email}:${dayjs().format('YYYYMMDD')}`;
const failKey = (email: string): string => `login_fail:${email}`;

const DAILY_QUOTA = 10;

function gen6(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerifyCode(email: string): Promise<void> {
  const lock = await redis.set(lockKey(email), '1', 'EX', 60, 'NX');
  if (lock !== 'OK') throw Errors.tooMany('1分钟内只能请求一次验证码');

  const cnt = await redis.incr(quotaKey(email));
  if (cnt === 1) await redis.expire(quotaKey(email), 86400);
  if (cnt > DAILY_QUOTA) throw Errors.tooMany('当日验证码请求次数超限');

  const code = gen6();
  await redis.set(codeKey(email), code, 'EX', 600);
  const m = verifyCodeMail(code);
  // 异步发送，不阻塞响应
  sendMail({ to: email, subject: m.subject, text: m.text, html: m.html }).catch(() => undefined);
}

async function consumeCode(email: string, code: string): Promise<void> {
  const stored = await redis.get(codeKey(email));
  if (!stored || stored !== code) throw Errors.badRequest('验证码无效或已过期');
  await redis.del(codeKey(email));
}

function findUserByEmail(email: string): UserRow | undefined {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;
}

function createUser(email: string, hashed: string | null): UserRow {
  const id = newId();
  const created = now();
  db.prepare('INSERT INTO users(id, email, password, created_at) VALUES (?,?,?,?)').run(
    id,
    email,
    hashed,
    created
  );
  db.prepare('INSERT INTO user_configs(user_id, remind_email) VALUES (?, ?)').run(id, email);
  return { id, email, password: hashed, created_at: created };
}

export async function register(email: string, code: string, password: string): Promise<{ token: string; user: { id: string; email: string } }> {
  if (findUserByEmail(email)) throw Errors.conflict('该邮箱已注册');
  await consumeCode(email, code);
  const hashed = await hashPassword(password);
  const user = createUser(email, hashed);
  const token = signToken({ sub: user.id, email: user.email });
  return { token, user: { id: user.id, email: user.email } };
}

export async function loginByPassword(email: string, password: string): Promise<{ token: string; user: { id: string; email: string } }> {
  const failed = parseInt((await redis.get(failKey(email))) || '0', 10);
  if (failed >= 5) throw Errors.tooMany('登录失败次数过多，请15分钟后重试');

  const user = findUserByEmail(email);
  if (!user || !user.password) {
    await redis.incr(failKey(email));
    await redis.expire(failKey(email), 900);
    throw Errors.unauthorized('邮箱或密码错误');
  }
  const ok = await comparePassword(password, user.password);
  if (!ok) {
    await redis.incr(failKey(email));
    await redis.expire(failKey(email), 900);
    throw Errors.unauthorized('邮箱或密码错误');
  }
  await redis.del(failKey(email));
  const token = signToken({ sub: user.id, email: user.email });
  return { token, user: { id: user.id, email: user.email } };
}

export async function loginByCode(email: string, code: string): Promise<{ token: string; user: { id: string; email: string } }> {
  await consumeCode(email, code);
  let user = findUserByEmail(email);
  if (!user) user = createUser(email, null);
  const token = signToken({ sub: user.id, email: user.email });
  return { token, user: { id: user.id, email: user.email } };
}

export function getUserById(id: string): { id: string; email: string; created_at: number } | undefined {
  const u = db.prepare('SELECT id, email, created_at FROM users WHERE id = ?').get(id) as
    | { id: string; email: string; created_at: number }
    | undefined;
  return u;
}
