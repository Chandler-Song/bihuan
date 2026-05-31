-- 标签表（用户级别）
CREATE TABLE IF NOT EXISTS tags (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  name       TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(user_id, name)
);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);

-- 任务-标签关联表
CREATE TABLE IF NOT EXISTS task_tags (
  task_id TEXT NOT NULL,
  tag_id  TEXT NOT NULL,
  PRIMARY KEY (task_id, tag_id),
  FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY(tag_id)  REFERENCES tags(id)  ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_task_tags_tag_id ON task_tags(tag_id);
