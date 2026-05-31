import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';
import { logger } from '../config/logger';

const dbPath = path.resolve(process.cwd(), env.SQLITE_PATH);
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const CURRENT_VERSION = 2;

function getUserVersion(): number {
  const row = db.pragma('user_version', { simple: true }) as number;
  return row || 0;
}

function setUserVersion(v: number): void {
  db.pragma(`user_version = ${v}`);
}

function runMigration(file: string): void {
  const sql = fs.readFileSync(path.join(__dirname, 'migrations', file), 'utf-8');
  db.exec(sql);
}

export function migrate(): void {
  const v = getUserVersion();
  logger.info({ v }, 'sqlite current schema version');
  if (v < 1) {
    runMigration('0001_init.sql');
    setUserVersion(1);
    logger.info('migration 0001_init applied');
  }
  if (v < 2) {
    runMigration('0002_tags.sql');
    setUserVersion(2);
    logger.info('migration 0002_tags applied');
  }
  if (getUserVersion() !== CURRENT_VERSION) {
    setUserVersion(CURRENT_VERSION);
  }
}
