import { Modal, Form, Input, Select, DatePicker, message } from 'antd';
import dayjs from 'dayjs';
import { tasksApi, type Task } from '@/api';
import { useState, useEffect } from 'react';

interface Props {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function TaskEditModal({ task, open, onClose, onSaved }: Props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) {
      form.setFieldsValue({
        content: task.content,
        priority: task.priority,
        note: task.note,
        remindDateTime: dayjs(task.next_remind_at),
        tags: task.tags || [],
      });
    }
  }, [task, form]);

  async function handleSave() {
    const values = await form.validateFields();
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        content: values.content,
        priority: values.priority,
        note: values.note || '',
        tags: values.tags || [],
        next_remind_at: values.remindDateTime.valueOf(),
      };
      await tasksApi.patch(task!.id, body);
      message.success('已保存');
      onSaved();
      onClose();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      message.error(err?.response?.data?.message || err?.message || '保存失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      title="编辑任务"
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      confirmLoading={loading}
      okText="保存"
      cancelText="取消"
    >
      <Form form={form} layout="vertical">
        <Form.Item name="content" label="任务内容" rules={[{ required: true, max: 500, message: '请输入任务内容' }]}>
          <Input.TextArea rows={3} placeholder="描述你的任务" />
        </Form.Item>
        <Form.Item name="priority" label="优先级">
          <Select
            options={[
              { label: '重要', value: 'high' },
              { label: '普通', value: 'normal' },
              { label: '不急', value: 'low' },
            ]}
          />
        </Form.Item>
        <Form.Item name="remindDateTime" label="下次提醒时间">
          <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="tags" label="标签">
          <Select
            mode="tags"
            placeholder="输入标签后回车"
            maxCount={10}
            tokenSeparators={[',']}
          />
        </Form.Item>
        <Form.Item name="note" label="备注">
          <Input.TextArea rows={3} placeholder="可选，添加备注信息" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
