PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id         TEXT PRIMARY KEY,
  email      TEXT UNIQUE NOT NULL,
  password   TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL,
  content        TEXT NOT NULL,
  priority       TEXT DEFAULT 'normal',
  status         TEXT DEFAULT 'pending',
  created_at     INTEGER NOT NULL,
  next_remind_at INTEGER NOT NULL,
  remind_count   INTEGER DEFAULT 0,
  reminded       INTEGER DEFAULT 0,
  snoozed_until  INTEGER,
  closed_at      INTEGER,
  note           TEXT DEFAULT '',
  FOREIGN KEY(user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id        ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_next_remind_at ON tasks(next_remind_at);
CREATE INDEX IF NOT EXISTS idx_tasks_status         ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status    ON tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_closed_at      ON tasks(closed_at);

CREATE TABLE IF NOT EXISTS remind_logs (
  id          TEXT PRIMARY KEY,
  task_id     TEXT NOT NULL,
  user_id     TEXT NOT NULL,
  reminded_at INTEGER NOT NULL,
  channel     TEXT,
  action      TEXT
);
CREATE INDEX IF NOT EXISTS idx_remind_logs_task_id ON remind_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_remind_logs_user_id ON remind_logs(user_id);

CREATE TABLE IF NOT EXISTS user_configs (
  user_id           TEXT PRIMARY KEY,
  remind_email      TEXT,
  daily_remind_time TEXT DEFAULT '09:00',
  weekly_report     INTEGER DEFAULT 1,
  monthly_report    INTEGER DEFAULT 1,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
