import { Card, Tag, Button, Dropdown, Popconfirm, Space, message, Modal, InputNumber } from 'antd';
import { ClockCircleOutlined, CheckOutlined, DeleteOutlined, DownOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { tasksApi, type Task } from '@/api';
import { useState } from 'react';
import TaskEditModal from './TaskEditModal';

interface Props {
  task: Task;
  onChange: () => void;
}

const SNOOZE_PRESETS: { label: string; days: number }[] = [
  { label: '明天', days: 1 },
  { label: '3天后', days: 3 },
  { label: '1周后', days: 7 },
  { label: '2周后', days: 14 },
  { label: '1个月后', days: 30 },
  { label: '3个月后', days: 90 },
];

export default function TaskCard({ task, onChange }: Props) {
  const [customOpen, setCustomOpen] = useState(false);
  const [customDays, setCustomDays] = useState<number>(1);
  const [editOpen, setEditOpen] = useState(false);
  const danger = task.status === 'pending' && task.remind_count >= 2;

  async function close() {
    const r = await tasksApi.patch(task.id, { status: 'done' });
    if (r.encourage) message.success(r.encourage);
    onChange();
  }
  async function snooze(d: number) {
    await tasksApi.patch(task.id, { snoozeDays: d });
    message.success('已延期');
    onChange();
  }
  async function remove() {
    await tasksApi.remove(task.id);
    onChange();
  }

  return (
    <Card
      size="small"
      style={{
        marginBottom: 10,
        borderColor: danger ? '#ff4d4f' : undefined,
        background: danger ? '#fff1f0' : undefined,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Space size={6} wrap>
            {task.priority === 'high' && <Tag color="red">重要</Tag>}
            {task.priority === 'low' && <Tag>不急</Tag>}
            {danger && <Tag color="red">紧急</Tag>}
            {task.status === 'done' && <Tag color="green">已闭环</Tag>}
            <span style={{ fontSize: 15, fontWeight: 500, textDecoration: task.status === 'done' ? 'line-through' : 'none' }}>
              {task.content}
            </span>
          </Space>
          {task.tags && task.tags.length > 0 && (
            <div style={{ marginTop: 4 }}>
              {task.tags.map(tag => (
                <Tag key={tag} color="blue" style={{ marginRight: 4 }}>{tag}</Tag>
              ))}
            </div>
          )}
          <div style={{ color: '#888', fontSize: 12, marginTop: 4 }}>
            <ClockCircleOutlined /> 下次提醒 {dayjs(task.next_remind_at).format('MM-DD HH:mm')}
            {task.remind_count > 0 && ` · 已提醒 ${task.remind_count} 次`}
          </div>
        </div>
        {task.status === 'pending' && (
          <Space>
            <Button size="small" icon={<EditOutlined />} onClick={() => setEditOpen(true)}>编辑</Button>
            <Dropdown
              menu={{
                items: [
                  ...SNOOZE_PRESETS.map((p) => ({
                    key: String(p.days),
                    label: p.label,
                    onClick: () => snooze(p.days),
                  })),
                  { type: 'divider' as const },
                  { key: 'custom', label: '自定义天数', onClick: () => setCustomOpen(true) },
                ],
              }}
            >
              <Button size="small">延期 <DownOutlined /></Button>
            </Dropdown>
            <Button size="small" type="primary" icon={<CheckOutlined />} onClick={close}>闭环</Button>
          </Space>
        )}
        <Popconfirm title="确定删除这个任务？" onConfirm={remove}>
          <Button size="small" type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      </div>
      <Modal
        open={customOpen}
        title="自定义延期天数"
        onCancel={() => setCustomOpen(false)}
        onOk={async () => {
          await snooze(customDays);
          setCustomOpen(false);
        }}
      >
        <InputNumber min={1} max={365} value={customDays} onChange={(v) => setCustomDays(Number(v) || 1)} addonAfter="天" />
      </Modal>
      <TaskEditModal task={task} open={editOpen} onClose={() => setEditOpen(false)} onSaved={onChange} />
    </Card>
  );
}
