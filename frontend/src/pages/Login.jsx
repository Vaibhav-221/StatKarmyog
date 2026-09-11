/**
 * Login page — officer selector with a polished, themed card.
 *
 * No real auth — picks an officer from the mock list,
 * sets the AuthContext, and navigates to the dashboard.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Select, Button, Typography, Space, message } from 'antd';
import {
  LoginOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { MOCK_OFFICERS } from '../api/client';
import AppHeader from '../components/AppHeader';

const { Title, Text } = Typography;

export default function LoginPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (!selectedId) {
      message.warning('Please select an officer to continue');
      return;
    }
    setLoading(true);
    const officer = MOCK_OFFICERS.find((o) => o.officer_id === selectedId);
    const userRole = officer.role || 'officer';

    // Simulate a brief login delay for UX polish
    setTimeout(() => {
      setUser({
        officer_id: officer.officer_id,
        name: officer.name,
        designation: officer.designation,
        department: officer.department,
        role: userRole,
      });
      navigate(userRole === 'admin' ? '/admin' : '/');
    }, 400);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppHeader showUser={false} />
      <div className="login-page" style={{ flex: 1, minHeight: 'calc(100vh - 64px)' }}>
        <Card className="login-card" bordered={false}>
          <div className="login-header">
            <SafetyCertificateOutlined
              style={{
                fontSize: 40,
                color: '#0C447C',
                marginBottom: 10,
                display: 'block',
              }}
            />
            <Title level={2} style={{ marginBottom: 2, color: '#0C447C', fontWeight: 700 }}>
              StatKarmyog
            </Title>
            <Text strong style={{ fontSize: 13, color: '#5A6B7D', display: 'block', marginBottom: 4 }}>
              Skill Intelligence &amp; Learning Platform
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Competency &amp; Gap Analysis for MoSPI/NSSTA Officials
            </Text>
          </div>

          <Space direction="vertical" size={20} style={{ width: '100%' }}>
            <div>
              <Text
                strong
                style={{
                  fontSize: 12,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: '#5A6B7D',
                  display: 'block',
                  marginBottom: 8,
                }}
              >
                Select Officer
              </Text>
              <Select
                placeholder="Choose your profile…"
                style={{ width: '100%' }}
                size="large"
                suffixIcon={<UserOutlined />}
                value={selectedId}
                onChange={setSelectedId}
                options={MOCK_OFFICERS.map((o) => ({
                  value: o.officer_id,
                  label: (
                    <span>
                      <strong>{o.name}</strong>
                      <span style={{ color: '#8C99A9', marginLeft: 8, fontSize: 12 }}>
                        {o.designation}
                      </span>
                    </span>
                  ),
                }))}
                optionFilterProp="label"
                showSearch
              />
            </div>

            <Button
              type="primary"
              size="large"
              block
              icon={<LoginOutlined />}
              onClick={handleLogin}
              loading={loading}
              style={{
                height: 46,
                fontWeight: 600,
                fontSize: 15,
                borderRadius: 10,
              }}
            >
              Sign In
            </Button>
          </Space>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Text type="secondary" style={{ fontSize: 11 }}>
              Prototype — Smart India Hackathon PS 26101
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
}
