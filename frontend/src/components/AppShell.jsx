/**
 * AppShell — Main layout wrapper with complete sidebar navigation hierarchy.
 *
 * Implements section 4 sidebar structure for STATKARMAYOG.
 */

import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  BookOutlined,
  FilePdfOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined,
  RiseOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  HomeOutlined,
  GlobalOutlined,
  AuditOutlined,
  SettingOutlined,
  LogoutOutlined,
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
      icon: <HomeOutlined />,
      label: 'Portal Overview',
    },
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/profile',
      icon: <UserOutlined />,
      label: 'My Profile',
    },
    {
      key: 'competency_group',
      icon: <CheckCircleOutlined />,
      label: 'Competency',
      children: [
        { key: '/competencies', label: 'My Competencies' },
        { key: '/gaps', label: 'Gap Analysis' },
        { key: '/quiz', label: 'Assessment' },
      ],
    },
    {
      key: 'evidence_group',
      icon: <FilePdfOutlined />,
      label: 'Work Evidence',
      children: [
        { key: '/upload-artifact', label: 'Upload Artifact' },
        { key: '/evidence-history', label: 'Evidence History' },
      ],
    },
    {
      key: 'learning_group',
      icon: <BookOutlined />,
      label: 'Learning',
      children: [
        { key: '/learning', label: 'Recommended Learning' },
        { key: '/igot', label: 'iGOT / NSSTA' },
      ],
    },
    {
      key: 'ai_quiz_group',
      icon: <ThunderboltOutlined />,
      label: 'AI Quiz',
      children: [
        { key: '/quiz', label: 'Generate Quiz' },
        { key: '/my-quizzes', label: 'My Quizzes' },
      ],
    },
    {
      key: '/passport',
      icon: <SafetyCertificateOutlined />,
      label: 'Competency Passport',
    },
    {
      key: '/progress',
      icon: <RiseOutlined />,
      label: 'Progress',
    },
    ...(user?.role === 'admin'
      ? [
          {
            key: '/admin',
            icon: <BarChartOutlined />,
            label: 'Admin View (Training Intel)',
          },
        ]
      : []),
  ];

  const handleMenuClick = ({ key }) => {
    if (key && !key.includes('_group')) {
      navigate(key);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
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
        {/* Brand Header */}
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '0' : '0 20px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            cursor: 'pointer',
          }}
          onClick={() => navigate('/dashboard')}
        >
          <SafetyCertificateOutlined style={{ color: '#60A5FA', fontSize: 22 }} />
          {!collapsed && (
            <div style={{ marginLeft: 12, lineHeight: 1.2 }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, letterSpacing: '-0.3px' }}>
                STATKARMAYOG
              </div>
              <div style={{ color: '#94A3B8', fontSize: 10 }}>AI Competency Platform</div>
            </div>
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

      {/* Main Content Layout */}
      <Layout style={{ marginLeft: collapsed ? 72 : 240, transition: 'margin-left 0.2s' }}>
        <AppHeader collapsed={collapsed} setCollapsed={setCollapsed} showUser={true} />

        <Content style={{ overflow: 'auto', minHeight: 'calc(100vh - 64px)' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
