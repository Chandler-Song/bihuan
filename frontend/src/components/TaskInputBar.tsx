import { Input, message } from 'antd';
import { useState } from 'react';
import { tasksApi } from '@/api';

interface Props {
  onCreated: () => void;
}

export default function TaskInputBar({ onCreated }: Props) {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const text = value.trim();
    if (!text) return;
    setLoading(true);
    try {
      await tasksApi.create(text);
      setValue('');
      message.success('已创建');
      onCreated();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      message.error(err?.response?.data?.message || err?.message || '创建失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: 'sticky',
        bottom: 0,
        padding: '12px 0',
        background: '#fff',
        borderTop: '1px solid #f0f0f0',
        zIndex: 10,
      }}
    >
      <Input.Search
        placeholder="输入新任务，如：明天提醒我交报告 #工作 / 下周联系客户 #重要"
        enterButton={loading ? '提交中...' : '提交'}
        size="large"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onSearch={handleSubmit}
        loading={loading}
        allowClear
      />
    </div>
  );
}
