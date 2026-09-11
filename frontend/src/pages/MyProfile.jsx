/**
 * My Profile — Officer details & Role -> Activities -> Competency Mapping.
 *
 * Demonstrates: ROLE -> ACTIVITIES -> REQUIRED COMPETENCIES workflow.
 */

import React from 'react';
import { Row, Col, Card, Typography, Tag, Space, Timeline, Divider, Descriptions } from 'antd';
import {
  UserOutlined,
  IdcardOutlined,
  BookOutlined,
  SafetyCertificateOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { MOCK_OFFICER_PROFILE } from '../data/mockData';

const { Title, Text, Paragraph } = Typography;

export default function MyProfile() {
  const profile = MOCK_OFFICER_PROFILE;

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, color: '#0C447C' }}>
          Officer Profile
        </Title>
        <Text type="secondary">
          Official Statistical System — Competency & Role Alignment
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
                fontSize: 36,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                boxShadow: '0 4px 12px rgba(12,68,124,0.2)',
              }}
            >
              KN
            </div>
            <Title level={4} style={{ margin: 0 }}>
              {profile.name}
            </Title>
            <Tag color="blue" style={{ marginTop: 6, fontWeight: 600 }}>
              {profile.designation}
            </Tag>
          </Col>

          <Col xs={24} md={18}>
            <Descriptions title="Officer Summary" column={{ xs: 1, sm: 2, md: 3 }} bordered size="small">
              <Descriptions.Item label="Officer ID">{profile.officer_id}</Descriptions.Item>
              <Descriptions.Item label="Department">{profile.department}</Descriptions.Item>
              <Descriptions.Item label="Experience">{profile.experience_years} Years</Descriptions.Item>
              <Descriptions.Item label="Qualification">{profile.qualification}</Descriptions.Item>
              <Descriptions.Item label="Primary Domain" span={2}>
                {profile.primary_domain}
              </Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
      </Card>

      {/* ROLE -> ACTIVITIES -> COMPETENCIES Mapping Flow */}
      <Card
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#0C447C' }} />
            <span style={{ color: '#0C447C', fontWeight: 600 }}>Role Requirements Mapping</span>
          </Space>
        }
        bordered={false}
        style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">
            Under India's FRAC (Framework for Roles, Activities & Competencies), competencies are derived directly from assigned job activities.
          </Text>
        </div>

        <Row gutter={[24, 24]} align="stretch" style={{ marginTop: 24 }}>
          {/* Step 1: ROLE */}
          <Col xs={24} md={8}>
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                padding: 20,
                height: '100%',
              }}
            >
              <Tag color="navy" style={{ marginBottom: 12, background: '#0C447C', color: '#fff' }}>
                1. ASSIGNED ROLE
              </Tag>
              <Title level={4} style={{ color: '#0C447C', marginTop: 4 }}>
                {profile.role_details.role_title}
              </Title>
              <Paragraph style={{ fontSize: 13, color: '#64748B' }}>
                Responsible for executing statistical sample surveys, data quality assurance, and statistical reporting.
              </Paragraph>
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <ArrowRightOutlined style={{ fontSize: 24, color: '#0C447C' }} />
              </div>
            </div>
          </Col>

          {/* Step 2: ACTIVITIES */}
          <Col xs={24} md={8}>
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                padding: 20,
                height: '100%',
              }}
            >
              <Tag color="blue" style={{ marginBottom: 12 }}>
                2. KEY ACTIVITIES
              </Tag>
              <ul style={{ paddingLeft: 18, margin: 0, fontSize: 13, color: '#334155' }}>
                {profile.role_details.activities.map((act, idx) => (
                  <li key={idx} style={{ marginBottom: 10 }}>
                    {act}
                  </li>
                ))}
              </ul>
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <ArrowRightOutlined style={{ fontSize: 24, color: '#0C447C' }} />
              </div>
            </div>
          </Col>

          {/* Step 3: COMPETENCIES */}
          <Col xs={24} md={8}>
            <div
              style={{
                background: '#F0F7FF',
                border: '1px solid #BAE6FD',
                borderRadius: 8,
                padding: 20,
                height: '100%',
              }}
            >
              <Tag color="green" style={{ marginBottom: 12 }}>
                3. REQUIRED COMPETENCIES
              </Tag>
              <Space direction="vertical" style={{ width: '100%' }} size={8}>
                {profile.role_details.required_competencies.map((comp) => (
                  <div
                    key={comp.cid}
                    style={{
                      background: '#fff',
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid #E2E8F0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Text strong style={{ fontSize: 13, color: '#0C447C' }}>
                      {comp.name}
                    </Text>
                    <Tag color={comp.status === 'High Gap' ? 'error' : comp.status === 'Moderate Gap' ? 'warning' : 'success'}>
                      Req: {comp.required}%
                    </Tag>
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
