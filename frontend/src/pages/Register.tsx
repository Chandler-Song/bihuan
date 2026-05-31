import { useState } from 'react';
import { Card, Form, Input, Button, message, Space } from 'antd';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '@/api';
import { useAuthStore } from '@/stores/auth';

export default function Register() {
  const nav = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [sending, setSending] = useState(false);
  const [count, setCount] = useState(0);
  const [form] = Form.useForm();

  async function onSendCode() {
    const email = form.getFieldValue('email');
    if (!email) return message.warning('请先填写邮箱');
    try {
      setSending(true);
      await authApi.sendCode(email, 'register');
      message.success('验证码已发送');
      setCount(60);
      const t = setInterval(() => {
        setCount((c) => {
          if (c <= 1) { clearInterval(t); return 0; }
          return c - 1;
        });
      }, 1000);
    } finally {
      setSending(false);
    }
  }

  async function onSubmit(values: { email: string; code: string; password: string }) {
    const r = await authApi.register(values.email, values.code, values.password);
    setAuth(r.token, r.user);
    message.success('注册成功');
    nav('/today', { replace: true });
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa' }}>
      <Card style={{ width: 380 }} title={<div style={{ textAlign: 'center', fontSize: 22, color: '#1677ff' }}>注册闭环</div>}>
        <Form form={form} layout="vertical" onFinish={onSubmit} autoComplete="off">
          <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="you@example.com" />
          </Form.Item>
          <Form.Item name="code" label="验证码" rules={[{ required: true, pattern: /^\d{6}$/, message: '6位数字' }]}>
            <Space.Compact style={{ width: '100%' }}>
              <Input placeholder="6位验证码" />
              <Button disabled={count > 0 || sending} onClick={onSendCode}>
                {count > 0 ? `${count}s` : '获取'}
              </Button>
            </Space.Compact>
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, min: 6 }]}>
            <Input.Password placeholder="至少6位" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>注册</Button>
        </Form>
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          已有账号？<Link to="/login">去登录</Link>
        </div>
      </Card>
    </div>
  );
}
