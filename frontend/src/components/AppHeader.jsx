/**
 * AppHeader — shared top header / navbar component.
 *
 * Displays the platform brand name "StatKarmyog" in the top-left,
 * styled using the custom AntD primary color (#0C447C), 18-20px semi-bold/bold text.
 *
 * Used across all pages (AppShell for authenticated pages, Login page for public header).
 */

import { Layout, Button, Typography, Space, Avatar } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Header } = Layout;
const { Text } = Typography;

export default function AppHeader({ collapsed, setCollapsed, showUser = true }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

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
      <Space size={16} align="center">
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
          onClick={() => navigate(user ? '/' : '/login')}
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
              color: '#5A6B7D',
              background: '#E8F0F8',
              padding: '2px 8px',
              borderRadius: 12,
              border: '1px solid #C5DFA8',
              lineHeight: 1.4,
            }}
          >
            Skill Intel
          </span>
        </div>
      </Space>

      {showUser && user && (
        <Space size={16} align="center">
          <Avatar
            style={{ backgroundColor: '#0C447C' }}
            icon={<UserOutlined />}
            size={34}
          >
            {initials}
          </Avatar>
          <div style={{ lineHeight: 1.3 }}>
            <Text strong style={{ fontSize: 13, display: 'block' }}>
              {user?.name || 'Officer'}
            </Text>
            <Text
              type="secondary"
              style={{ fontSize: 11, display: 'block' }}
            >
              {user?.department || ''}
            </Text>
          </div>
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            style={{ color: '#8C99A9' }}
            title="Logout"
          />
        </Space>
      )}
    </Header>
  );
}
