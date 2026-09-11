/**
 * My Profile — Dynamic Officer Profile & FRAC Role Mapping from backend API.
 */

import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Typography, Tag, Space, Descriptions, Skeleton } from 'antd';
import {
  SafetyCertificateOutlined,
  ArrowRightOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { getOfficerProfile } from '../api/client';

const { Title, Text, Paragraph } = Typography;

export default function MyProfile() {
  const { user } = useAuth();
  const officerId = user?.officer_id || 'OFF001';

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      const res = await getOfficerProfile(officerId);
      setProfile(res.data);
      setLoading(false);
    }
    loadProfile();
  }, [officerId]);

  if (loading) {
    return (
      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    );
  }

  const name = profile?.name || user?.name || 'Statistical Officer';
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const currentSkills = profile?.current_skills || {};
  const skillEntries = Object.entries(currentSkills);

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, color: '#0C447C' }}>
          Officer Profile
        </Title>
        <Text type="secondary">
          Official Statistical System — Dynamic Profile & Role Competency Alignment
        </Text>
      </div>

      {/* Officer Bio Card */}
      <Card bordered={false} style={{ marginBottom: 24, borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} md={6} style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 90,
                height: 90,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0C447C 0%, #1E5AA8 100%)',
                color: '#fff',
                fontSize: 32,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                boxShadow: '0 4px 12px rgba(12,68,124,0.2)',
              }}
            >
              {initials}
            </div>
            <Title level={4} style={{ margin: 0 }}>
              {name}
            </Title>
            <Tag color="blue" style={{ marginTop: 6, fontWeight: 600 }}>
              {profile?.designation || 'Statistical Officer'}
            </Tag>
          </Col>

          <Col xs={24} md={18}>
            <Descriptions title="Officer Summary (Dynamic Backend Entity)" column={{ xs: 1, sm: 2, md: 3 }} bordered size="small">
              <Descriptions.Item label="Officer ID">{profile?.officer_id || officerId}</Descriptions.Item>
              <Descriptions.Item label="Department">{profile?.department || 'MoSPI Division'}</Descriptions.Item>
              <Descriptions.Item label="Experience">{profile?.experience_years || 5} Years</Descriptions.Item>
              <Descriptions.Item label="Qualification">{profile?.qualification || 'M.Sc. Statistics'}</Descriptions.Item>
              <Descriptions.Item label="Role ID">{profile?.role_id || 'R01'}</Descriptions.Item>
              <Descriptions.Item label="Past Trainings">
                {(profile?.past_trainings || ['SSS Induction']).join(', ')}
              </Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
      </Card>

      {/* FRAC Workflow: ROLE -> ACTIVITIES -> COMPETENCIES */}
      <Card
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#0C447C' }} />
            <span style={{ color: '#0C447C', fontWeight: 600 }}>FRAC Framework Alignment</span>
          </Space>
        }
        bordered={false}
        style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
      >
        <Row gutter={[24, 24]} align="stretch">
          <Col xs={24} md={8}>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 20, height: '100%' }}>
              <Tag color="navy" style={{ marginBottom: 12, background: '#0C447C', color: '#fff' }}>
                1. ASSIGNED ROLE
              </Tag>
              <Title level={4} style={{ color: '#0C447C', marginTop: 4 }}>
                {profile?.designation || 'Statistical Officer'}
              </Title>
              <Paragraph style={{ fontSize: 13, color: '#64748B' }}>
                Responsible for sampling design, statistical data collection, data quality validation, and reporting.
              </Paragraph>
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <ArrowRightOutlined style={{ fontSize: 24, color: '#0C447C' }} />
              </div>
            </div>
          </Col>

          <Col xs={24} md={8}>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 20, height: '100%' }}>
              <Tag color="blue" style={{ marginBottom: 12 }}>
                2. KEY ACTIVITIES
              </Tag>
              <ul style={{ paddingLeft: 18, margin: 0, fontSize: 13, color: '#334155' }}>
                <li style={{ marginBottom: 8 }}>Survey planning & questionnaire design</li>
                <li style={{ marginBottom: 8 }}>Field data collection & sampling selection</li>
                <li style={{ marginBottom: 8 }}>Statistical data quality audit & validation</li>
                <li style={{ marginBottom: 8 }}>Data reporting & metadata preparation</li>
              </ul>
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <ArrowRightOutlined style={{ fontSize: 24, color: '#0C447C' }} />
              </div>
            </div>
          </Col>

          <Col xs={24} md={8}>
            <div style={{ background: '#F0F7FF', border: '1px solid #BAE6FD', borderRadius: 8, padding: 20, height: '100%' }}>
              <Tag color="green" style={{ marginBottom: 12 }}>
                3. CURRENT COMPETENCY LEVELS
              </Tag>
              <Space direction="vertical" style={{ width: '100%' }} size={8}>
                {skillEntries.map(([skill, lvl]) => (
                  <div key={skill} style={{ background: '#fff', padding: '6px 12px', borderRadius: 6, border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between' }}>
                    <Text strong style={{ fontSize: 13, color: '#0C447C' }}>{skill}</Text>
                    <Tag color="blue">Level {lvl} / 5</Tag>
                  </div>
                ))}
              </Space>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
