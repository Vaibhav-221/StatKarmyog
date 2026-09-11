/**
 * Login Page — STATKARMAYOG Professional Government-Tech Portal.
 *
 * Implements Section 5 of requirements:
 * STATKARMAYOG branding, Officer ID, Password, Login button, and Prototype Quick Select.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Input, Button, Typography, Space, Select, Divider, message } from 'antd';
import {
  LoginOutlined,
  UserOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { MOCK_OFFICERS } from '../api/client';
import AppHeader from '../components/AppHeader';

const { Title, Text, Paragraph } = Typography;

export default function LoginPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const [officerId, setOfficerId] = useState('OFF001');
  const [password, setPassword] = useState('••••••••');
  const [selectedProfileId, setSelectedProfileId] = useState('OFF001');
  const [loading, setLoading] = useState(false);

  const performLogin = (targetId) => {
    setLoading(true);
    const idToUse = targetId || officerId || 'OFF001';
    const officer = MOCK_OFFICERS.find((o) => o.officer_id === idToUse) || MOCK_OFFICERS[0];
    const userRole = officer.role || 'officer';

    setTimeout(() => {
      setUser({
        officer_id: officer.officer_id,
        name: officer.name,
        designation: officer.designation,
        department: officer.department,
        role: userRole,
      });
      message.success(`Logged in as ${officer.name} (${officer.designation})`);
      navigate(userRole === 'admin' ? '/admin' : '/dashboard');
    }, 400);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F8FAFC' }}>
      <AppHeader showUser={false} />
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <Card
          bordered={false}
          style={{
            width: '100%',
            maxWidth: 460,
            borderRadius: 12,
            boxShadow: '0 8px 30px rgba(12,68,124,0.08)',
            padding: '12px 10px',
          }}
        >
          {/* Header Branding */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <SafetyCertificateOutlined
              style={{
                fontSize: 44,
                color: '#0C447C',
                marginBottom: 8,
              }}
            />
            <Title level={2} style={{ marginBottom: 2, color: '#0C447C', fontWeight: 700 }}>
              STATKARMAYOG
            </Title>
            <Text strong style={{ fontSize: 13, color: '#0C447C', display: 'block', marginBottom: 4 }}>
              AI-Powered Competency Development
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              For India's Official Statistical System (MoSPI / NSSTA)
            </Text>
          </div>

          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <div>
              <Text strong style={{ fontSize: 12, color: '#475569', display: 'block', marginBottom: 6 }}>
                Officer ID
              </Text>
              <Input
                size="large"
                prefix={<UserOutlined style={{ color: '#94A3B8' }} />}
                placeholder="Enter Officer ID (e.g. OFF001)"
                value={officerId}
                onChange={(e) => setOfficerId(e.target.value)}
              />
            </div>

            <div>
              <Text strong style={{ fontSize: 12, color: '#475569', display: 'block', marginBottom: 6 }}>
                Password
              </Text>
              <Input.Password
                size="large"
                prefix={<LockOutlined style={{ color: '#94A3B8' }} />}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button
              type="primary"
              size="large"
              block
              icon={<LoginOutlined />}
              onClick={() => performLogin(officerId)}
              loading={loading}
              style={{
                height: 44,
                fontWeight: 600,
                fontSize: 15,
                borderRadius: 8,
                background: '#0C447C',
              }}
            >
              Login
            </Button>

            <Divider style={{ margin: '12px 0', fontSize: 12, color: '#94A3B8' }}>
              PROTOTYPE DEMO ACCESS
            </Divider>

            <div>
              <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 6 }}>
                Quick Login Profile Selector (Demo Credentials):
              </Text>
              <Select
                value={selectedProfileId}
                onChange={(val) => {
                  setSelectedProfileId(val);
                  setOfficerId(val);
                }}
                style={{ width: '100%', marginBottom: 10 }}
                options={MOCK_OFFICERS.map((o) => ({
                  value: o.officer_id,
                  label: `${o.name} (${o.designation})`,
                }))}
              />
              <Button
                type="default"
                block
                icon={<ThunderboltOutlined />}
                onClick={() => performLogin(selectedProfileId)}
                style={{ borderColor: '#0C447C', color: '#0C447C', fontWeight: 600 }}
              >
                Prototype Quick Login
              </Button>
            </div>
          </Space>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Button
              type="link"
              size="small"
              onClick={() => navigate('/')}
              style={{ color: '#0C447C', fontSize: 12 }}
            >
              ← Back to Landing Page
            </Button>
            <div style={{ marginTop: 4 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>
                Smart India Hackathon 2026 • Problem Statement SIH26101
              </Text>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
