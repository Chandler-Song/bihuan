import { Layout as AntLayout, Menu, Avatar, Dropdown, Space } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  CalendarOutlined,
  UnorderedListOutlined,
  PieChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/stores/auth';

const { Header, Sider, Content } = AntLayout;

export default function Layout() {
  const nav = useNavigate();
  const loc = useLocation();
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);

  const items = [
    { key: '/today', icon: <CalendarOutlined />, label: '今日' },
    { key: '/tasks', icon: <UnorderedListOutlined />, label: '任务' },
    { key: '/summary', icon: <PieChartOutlined />, label: '总结' },
    { key: '/settings', icon: <SettingOutlined />, label: '设置' },
  ];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="md" collapsedWidth={0} theme="light">
        <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, color: '#1677ff' }}>
          闭环
        </div>
        <Menu
          mode="inline"
          selectedKeys={[loc.pathname]}
          items={items}
          onClick={(e) => nav(e.key)}
        />
      </Sider>
      <AntLayout>
        <Header style={{ background: '#fff', padding: '0 16px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'logout',
                  icon: <LogoutOutlined />,
                  label: '登出',
                  onClick: () => {
                    clear();
                    nav('/login', { replace: true });
                  },
                },
              ],
            }}
          >
            <Space style={{ cursor: 'pointer' }}>
              <Avatar size="small" icon={<UserOutlined />} />
              <span>{user?.email}</span>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: 16, padding: 16, background: '#fff', borderRadius: 8 }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
}
