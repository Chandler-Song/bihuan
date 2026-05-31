import { useEffect, useState, useCallback } from 'react';
import { Empty, Spin, Typography } from 'antd';
import { tasksApi, type Task } from '@/api';
import TaskCard from '@/components/TaskCard';
import TaskInputBar from '@/components/TaskInputBar';

export default function Today() {
  const [list, setList] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await tasksApi.list({ view: 'today', pageSize: 100 });
      setList(r.list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <Typography.Title level={3} style={{ marginTop: 0 }}>今日待办</Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginTop: -8 }}>
        今日需要提醒的任务，闭环之后会移到「已闭环」。
      </Typography.Paragraph>
      <div style={{ flex: 1 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}><Spin /></div>
        ) : list.length === 0 ? (
          <Empty description="今日没有待提醒的任务，享受当下 🎉" style={{ padding: 48 }} />
        ) : (
          list.map((t) => <TaskCard key={t.id} task={t} onChange={load} />)
        )}
      </div>
      <TaskInputBar onCreated={load} />
    </div>
  );
}
