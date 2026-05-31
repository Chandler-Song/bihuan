/**
 * 创建测试账号脚本
 * 用法: npx ts-node scripts/create-test-user.ts
 */
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.resolve(__dirname, '../data/bihuan.db');
const TEST_EMAIL = 'test@bihuan.local';
const TEST_PASSWORD = 'Test123456';

const db = new Database(DB_PATH);

function now(): number {
  return Date.now();
}

function genId(): string {
  // 简化版 nanoid
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 21; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

async function main() {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(TEST_EMAIL) as { id: string } | undefined;
  
  if (existing) {
    console.log(`✅ 测试账号已存在: ${TEST_EMAIL}`);
    console.log(`   密码: ${TEST_PASSWORD}`);
    db.close();
    return;
  }

  const hashed = await bcrypt.hash(TEST_PASSWORD, 10);
  const id = genId();
  const created = now();

  db.prepare('INSERT INTO users(id, email, password, created_at) VALUES (?,?,?,?)').run(
    id, TEST_EMAIL, hashed, created
  );
  
  db.prepare('INSERT INTO user_configs(user_id, remind_email) VALUES (?, ?)').run(id, TEST_EMAIL);

  console.log('✅ 测试账号创建成功！');
  console.log('');
  console.log('📧 邮箱:', TEST_EMAIL);
  console.log('🔑 密码:', TEST_PASSWORD);
  console.log('');
  console.log('登录地址: http://localhost:5173/login');
  
  db.close();
}

main().catch(e => {
  console.error(e);
  db.close();
  process.exit(1);
});
