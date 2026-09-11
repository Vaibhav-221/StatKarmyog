/**
 * AppShell — main layout wrapper with collapsible sidebar.
 *
 * Renders the AntD Layout with a dark sidebar (Dashboard + Quiz nav),
 * a header bar showing the officer name and logout, and a content area
 * that renders the <Outlet />.
 */

import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  FormOutlined,
  SafetyCertificateOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import AppHeader from './AppHeader';
import { useAuth } from '../context/AuthContext';

const { Sider, Content } = Layout;

export default function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/quiz',
      icon: <FormOutlined />,
      label: 'Quiz',
    },
    // Admin-only nav item
    ...(user?.role === 'admin'
      ? [
          {
            key: '/admin',
            icon: <BarChartOutlined />,
            label: 'Analytics',
          },
        ]
      : []),
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* ── Sidebar ──────────────────────────────────────── */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={240}
        collapsedWidth={72}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
      >
        {/* Brand mark */}
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '0' : '0 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            cursor: 'pointer',
          }}
          onClick={() => navigate('/')}
        >
          <SafetyCertificateOutlined
            style={{ color: '#60A5FA', fontSize: 22 }}
          />
          {!collapsed && (
            <span
              style={{
                color: '#fff',
                fontWeight: 700,
                fontSize: 16,
                marginLeft: 12,
                letterSpacing: '-0.3px',
                whiteSpace: 'nowrap',
              }}
            >
              StatKarmyog
            </span>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ marginTop: 8, border: 'none' }}
        />
      </Sider>

      {/* ── Main area ────────────────────────────────────── */}
      <Layout style={{ marginLeft: collapsed ? 72 : 240, transition: 'margin-left 0.2s' }}>
        <AppHeader collapsed={collapsed} setCollapsed={setCollapsed} showUser={true} />

        <Content style={{ overflow: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
