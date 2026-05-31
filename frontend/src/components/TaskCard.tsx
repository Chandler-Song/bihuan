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
  async function reopen() {
    await tasksApi.patch(task.id, { status: 'pending' });
    message.success('已重新打开');
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
      <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Space size={6} wrap>
            {/* 标签显示在前面 */}
            {task.tags && task.tags.length > 0 && task.tags.map(tag => (
              <Tag key={tag} color="blue">#{tag}</Tag>
            ))}
            {task.priority === 'high' && <Tag color="red">重要</Tag>}
            {task.priority === 'low' && <Tag>不急</Tag>}
            {danger && <Tag color="red">紧急</Tag>}
            {task.status === 'done' && <Tag color="green">已闭环</Tag>}
            <span style={{ fontSize: 15, fontWeight: 500, textDecoration: task.status === 'done' ? 'line-through' : 'none' }}>
              {task.content}
            </span>
          </Space>
          <div style={{ color: '#888', fontSize: 12, marginTop: 4 }}>
            <ClockCircleOutlined /> 下次提醒 {dayjs(task.next_remind_at).format('MM-DD HH:mm')}
            {task.remind_count > 0 && ` · 已提醒 ${task.remind_count} 次`}
            {task.closed_at && ` · 闭环于 ${dayjs(task.closed_at).format('MM-DD HH:mm')}`}
          </div>
        </div>
        <Space size={[0, 8]} wrap>
          {/* 所有任务都显示编辑按钮 */}
          <Button size="small" icon={<EditOutlined />} onClick={() => setEditOpen(true)}>编辑</Button>
          
          {/* 未闭环任务显示延期和闭环按钮 */}
          {task.status === 'pending' && (
            <>
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
            </>
          )}
          
          {/* 已闭环任务显示重新打开按钮 */}
          {task.status === 'done' && (
            <Button size="small" type="primary" icon={<ClockCircleOutlined />} onClick={reopen}>重新打开</Button>
          )}
          
          <Popconfirm title="确定删除这个任务？" onConfirm={remove}>
            <Button size="small" type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
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
