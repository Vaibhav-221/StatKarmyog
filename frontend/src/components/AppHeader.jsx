/**
 * AppHeader — shared top header / navbar component.
 *
 * Displays the platform brand name "StatKarmyog" in the top-left,
 * styled using the custom AntD primary color (#0C447C), 18-20px semi-bold/bold text.
 *
 * Used across all pages (AppShell for authenticated pages, Login page for public header).
 */

import React from 'react';
import { Layout, Button, Typography, Space, Avatar, Dropdown } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined,
  DashboardOutlined,
  LoginOutlined,
  AppstoreOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { MOCK_OFFICERS } from '../api/client';

const { Header } = Layout;
const { Text } = Typography;

export default function AppHeader({ collapsed, setCollapsed, showUser = true, isLanding = false }) {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const scrollToSection = (id) => {
    if (location.pathname !== '/') {
      navigate('/#' + id);
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleQuickLogin = (officerId) => {
    const officer = MOCK_OFFICERS.find((o) => o.officer_id === officerId) || MOCK_OFFICERS[0];
    setUser({
      officer_id: officer.officer_id,
      name: officer.name,
      designation: officer.designation,
      department: officer.department,
      role: officer.role || 'officer',
    });
    navigate(officer.role === 'admin' ? '/admin' : '/dashboard');
  };

  const quickLoginItems = MOCK_OFFICERS.map((o) => ({
    key: o.officer_id,
    label: (
      <div>
        <Text strong style={{ fontSize: 12, display: 'block' }}>
          {o.name}
        </Text>
        <Text type="secondary" style={{ fontSize: 11 }}>
          {o.designation}
        </Text>
      </div>
    ),
    onClick: () => handleQuickLogin(o.officer_id),
  }));

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  const isPublicView = isLanding || location.pathname === '/' || location.pathname === '/login';

  return (
    <Header
      style={{
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#ffffff',
        borderBottom: '1px solid #E8ECF1',
        position: 'sticky',
        top: 0,
        zIndex: 99,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        height: 64,
      }}
    >
      <Space size={20} align="center">
        {setCollapsed && (
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed((c) => !c)}
            style={{ fontSize: 16, width: 40, height: 40 }}
          />
        )}

        {/* ── Brand Logo / Title ────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            userSelect: 'none',
          }}
          onClick={() => navigate(user ? '/dashboard' : '/')}
        >
          <SafetyCertificateOutlined
            style={{
              fontSize: 24,
              color: '#0C447C',
              marginRight: 10,
            }}
          />
          <span
            style={{
              color: '#0C447C',
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '-0.3px',
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            }}
          >
            StatKarmyog
          </span>
          <span
            style={{
              marginLeft: 10,
              fontSize: 11,
              fontWeight: 600,
              color: '#0C447C',
              background: '#E8F0F8',
              padding: '2px 8px',
              borderRadius: 12,
              border: '1px solid #BAE6FD',
              lineHeight: 1.4,
            }}
          >
            Skill Intel
          </span>
        </div>

        {/* Landing Page Navbar Navigation Links */}
        {isPublicView && (
          <Space size={16} style={{ marginLeft: 20, display: 'flex' }}>
            <Button
              type="text"
              onClick={() => scrollToSection('hero')}
              style={{ fontWeight: 500, color: '#334155', fontSize: 13 }}
            >
              Overview
            </Button>
            <Button
              type="text"
              onClick={() => scrollToSection('value-loop')}
              style={{ fontWeight: 500, color: '#334155', fontSize: 13 }}
            >
              Value Loop
            </Button>
            <Button
              type="text"
              onClick={() => scrollToSection('pillars')}
              style={{ fontWeight: 500, color: '#334155', fontSize: 13 }}
            >
              Pillars
            </Button>
            <Button
              type="text"
              onClick={() => scrollToSection('demo-profiles')}
              style={{ fontWeight: 500, color: '#0C447C', fontSize: 13 }}
            >
              Demo Profiles
            </Button>
          </Space>
        )}
      </Space>

      {/* Right Action Area */}
      <Space size={12} align="center">
        {user ? (
          /* Authenticated User View */
          <Space size={12} align="center">
            {isPublicView && (
              <Button
                type="primary"
                icon={<DashboardOutlined />}
                onClick={() => navigate(user.role === 'admin' ? '/admin' : '/dashboard')}
                style={{
                  background: '#0C447C',
                  fontWeight: 600,
                  borderRadius: 6,
                }}
              >
                Go to Dashboard
              </Button>
            )}
            <Avatar style={{ backgroundColor: '#0C447C' }} icon={<UserOutlined />} size={34}>
              {initials}
            </Avatar>
            <div style={{ lineHeight: 1.2, textAlign: 'left' }}>
              <Text strong style={{ fontSize: 12, display: 'block', color: '#0F172A' }}>
                {user?.name || 'Officer'}
              </Text>
              <Text type="secondary" style={{ fontSize: 10, display: 'block' }}>
                {user?.designation || user?.department || ''}
              </Text>
            </div>
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              style={{ color: '#64748B' }}
              title="Logout"
            />
          </Space>
        ) : (
          /* Guest User View on Public Landing/Login */
          <Space size={10} align="center">
            <Dropdown menu={{ items: quickLoginItems }} placement="bottomRight">
              <Button style={{ borderRadius: 6, fontSize: 13, fontWeight: 500 }}>
                Demo Quick Select <DownOutlined style={{ fontSize: 10 }} />
              </Button>
            </Dropdown>
            <Button
              type="primary"
              icon={<LoginOutlined />}
              onClick={() => navigate('/login')}
              style={{
                background: '#0C447C',
                fontWeight: 600,
                borderRadius: 6,
                padding: '0 20px',
              }}
            >
              Officer Login
            </Button>
          </Space>
        )}
      </Space>
    </Header>
  );
}
