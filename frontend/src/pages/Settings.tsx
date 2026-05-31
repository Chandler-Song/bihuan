import { useEffect, useState } from 'react';
import { Card, Form, Input, TimePicker, Switch, Button, message, Typography, Spin, Space } from 'antd';
import dayjs from 'dayjs';
import { configApi, type UserConfigInput } from '@/api';

export default function Settings() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const c = await configApi.get();
        form.setFieldsValue({
          remind_email: c.remind_email || '',
          daily_remind_time: c.daily_remind_time ? dayjs(c.daily_remind_time, 'HH:mm') : dayjs('09:00', 'HH:mm'),
          weekly_report: !!c.weekly_report,
          monthly_report: !!c.monthly_report,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [form]);

  async function onFinish(values: Record<string, unknown>) {
    setSaving(true);
    try {
      const time = values.daily_remind_time as dayjs.Dayjs | undefined;
      const body: UserConfigInput = {
        remind_email: (values.remind_email as string) || '',
        daily_remind_time: time ? time.format('HH:mm') : '09:00',
        weekly_report: !!values.weekly_report,
        monthly_report: !!values.monthly_report,
      };
      await configApi.put(body);
      message.success('已保存');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      message.error(err?.response?.data?.message || err?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Typography.Title level={3} style={{ marginTop: 0 }}>设置</Typography.Title>
      <Card title="通知与总结">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}><Spin /></div>
        ) : (
          <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 480 }}>
            <Form.Item
              label="提醒邮箱"
              name="remind_email"
              rules={[{ type: 'email', message: '请输入有效邮箱' }]}
              extra="任务到期时邮件将发送到此邮箱（默认与登录邮箱一致）"
            >
              <Input placeholder="you@example.com" allowClear />
            </Form.Item>
            <Form.Item label="每日提醒时间" name="daily_remind_time">
              <TimePicker format="HH:mm" minuteStep={5} />
            </Form.Item>
            <Form.Item label="每周一 09:00 周报" name="weekly_report" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item label="每月 1 日 09:00 月报" name="monthly_report" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={saving}>保存</Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Card>
    </div>
  );
}
