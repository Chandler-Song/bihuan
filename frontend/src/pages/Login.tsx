import { useState } from 'react';
import { Card, Tabs, Form, Input, Button, message, Space } from 'antd';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '@/api';
import { useAuthStore } from '@/stores/auth';

export default function Login() {
  const nav = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [tab, setTab] = useState('password');
  const [sending, setSending] = useState(false);
  const [count, setCount] = useState(0);

  async function onSendCode(email: string) {
    if (!email) return message.warning('请先填写邮箱');
    try {
      setSending(true);
      await authApi.sendCode(email, 'login');
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

  async function onPwdSubmit(values: { email: string; password: string }) {
    const r = await authApi.login(values.email, values.password);
    setAuth(r.token, r.user);
    nav('/today', { replace: true });
  }

  async function onCodeSubmit(values: { email: string; code: string }) {
    const r = await authApi.loginByCode(values.email, values.code);
    setAuth(r.token, r.user);
    nav('/today', { replace: true });
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa' }}>
      <Card style={{ width: 380 }} title={<div style={{ textAlign: 'center', fontSize: 22, color: '#1677ff' }}>闭环 BiHuan</div>}>
        <Tabs
          activeKey={tab}
          onChange={setTab}
          items={[
            {
              key: 'password',
              label: '密码登录',
              children: (
                <Form layout="vertical" onFinish={onPwdSubmit} autoComplete="off">
                  <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email' }]}>
                    <Input placeholder="you@example.com" />
                  </Form.Item>
                  <Form.Item name="password" label="密码" rules={[{ required: true, min: 6 }]}>
                    <Input.Password placeholder="至少6位" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" block>登录</Button>
                </Form>
              ),
            },
            {
              key: 'code',
              label: '验证码登录',
              children: (
                <Form layout="vertical" onFinish={onCodeSubmit} autoComplete="off">
                  <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email' }]}>
                    <Input placeholder="you@example.com" />
                  </Form.Item>
                  <Form.Item name="code" label="验证码" rules={[{ required: true, pattern: /^\d{6}$/, message: '6位数字' }]}>
                    <Space.Compact style={{ width: '100%' }}>
                      <Input placeholder="6位验证码" />
                      <Button
                        disabled={count > 0 || sending}
                        onClick={(e) => {
                          e.preventDefault();
                          const form = (e.target as HTMLElement).closest('form');
                          const email = (form?.querySelector('input[id$="_email"]') as HTMLInputElement)?.value || '';
                          onSendCode(email);
                        }}
                      >
                        {count > 0 ? `${count}s` : '获取'}
                      </Button>
                    </Space.Compact>
                  </Form.Item>
                  <Button type="primary" htmlType="submit" block>登录</Button>
                </Form>
              ),
            },
          ]}
        />
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          还没有账号？<Link to="/register">立即注册</Link>
        </div>
      </Card>
    </div>
  );
}
