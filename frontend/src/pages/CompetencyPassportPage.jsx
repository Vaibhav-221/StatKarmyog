/**
 * Competency Passport Page — Signature feature proving before/after competency improvement.
 */

import React from 'react';
import { Row, Col, Card, Typography, Tag, Space, Divider, Alert, Badge } from 'antd';
import {
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  RiseOutlined,
  HistoryOutlined,
  FormOutlined,
  FilePdfOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { MOCK_PASSPORT_DATA } from '../data/mockData';

const { Title, Text, Paragraph } = Typography;

export default function CompetencyPassportPage() {
  const passport = MOCK_PASSPORT_DATA;

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#0C447C' }}>
            COMPETENCY PASSPORT
          </Title>
          <Text type="secondary">
            Verified, immutable record of competency scores, evidence sources, and trajectory progression.
          </Text>
        </div>

        <Tag color="navy" style={{ background: '#0C447C', color: '#fff', fontSize: 13, padding: '4px 14px', borderRadius: 12 }}>
          Officer Passport: {passport.officer_name} ({passport.role})
        </Tag>
      </div>

      <Alert
        message="Core Value Loop Proved: Before -> Learning -> Re-assessment -> Improvement"
        description="Competency scores are recorded sequentially in the database. Every quiz submission and artifact analysis creates a new historical checkpoint rather than overwriting past records."
        type="success"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* Trajectory Growth Line Chart */}
      <Card
        title={
          <Space>
            <RiseOutlined style={{ color: '#0C447C' }} />
            <span style={{ color: '#0C447C', fontWeight: 600 }}>Competency Growth Trajectory</span>
          </Space>
        }
        bordered={false}
        style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 24 }}
      >
        <div style={{ height: 260, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={passport.competencies[0].history}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="month" stroke="#64748B" />
              <YAxis domain={[0, 100]} stroke="#64748B" />
              <Tooltip
                contentStyle={{ background: '#fff', borderRadius: 8, border: '1px solid #CBD5E1' }}
                formatter={(val) => [`${val}%`, 'Sampling Methodology Score']}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#0C447C"
                strokeWidth={3}
                dot={{ r: 6, fill: '#0C447C' }}
                activeDot={{ r: 8, fill: '#52C41A' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Passport Cards per Competency */}
      <Title level={4} style={{ color: '#0C447C', marginBottom: 16 }}>
        Verified Passport Competency Stamp Cards
      </Title>

      <Row gutter={[24, 24]}>
        {passport.competencies.map((comp) => (
          <Col xs={24} md={12} lg={8} key={comp.cid}>
            <Card
              bordered={false}
              style={{
                borderRadius: 12,
                boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
                border: '1px solid #E2E8F0',
                background: '#FAFBFD',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Top Watermark Badge */}
              <div
                style={{
                  position: 'absolute',
                  top: -10,
                  right: -10,
                  opacity: 0.08,
                  fontSize: 100,
                  color: '#0C447C',
                  pointerEvents: 'none',
                }}
              >
                <SafetyCertificateOutlined />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text strong style={{ fontSize: 16, color: '#0C447C' }}>
                  {comp.skill_label}
                </Text>
                <Tag color="blue">{comp.confidence} Confidence</Tag>
              </div>

              <Row gutter={12} style={{ background: '#fff', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0', marginBottom: 16 }}>
                <Col span={6} style={{ textAlign: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 10 }}>PREVIOUS</Text>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#64748B' }}>{comp.previous_score}%</div>
                </Col>
                <Col span={6} style={{ textAlign: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 10 }}>CURRENT</Text>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0C447C' }}>{comp.current_score}%</div>
                </Col>
                <Col span={6} style={{ textAlign: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 10 }}>REQUIRED</Text>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#334155' }}>{comp.required_score}%</div>
                </Col>
                <Col span={6} style={{ textAlign: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 10 }}>GAIN</Text>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#389E0D' }}>+{comp.improvement}</div>
                </Col>
              </Row>

              <Text strong style={{ fontSize: 12, color: '#475569', display: 'block', marginBottom: 8 }}>
                VERIFIED EVIDENCE CHECKMARKS:
              </Text>

              <Space direction="vertical" style={{ width: '100%', fontSize: 12 }} size={6}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: comp.evidence_checkmarks.knowledge_assessment ? '#389E0D' : '#94A3B8' }}>
                  <CheckCircleOutlined /> Knowledge Assessment
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: comp.evidence_checkmarks.work_artifact ? '#389E0D' : '#94A3B8' }}>
                  <CheckCircleOutlined /> Work Artifact Evidence
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: comp.evidence_checkmarks.ai_quiz ? '#389E0D' : '#94A3B8' }}>
                  <CheckCircleOutlined /> AI Quiz Assessment
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: comp.evidence_checkmarks.reassessment ? '#389E0D' : '#94A3B8' }}>
                  <CheckCircleOutlined /> Re-assessment Verified
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
