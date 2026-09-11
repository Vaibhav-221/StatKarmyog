/**
 * Progress Page — Gap Reduction & Overall Learning Activity Analytics.
 */

import React from 'react';
import { Row, Col, Card, Typography, Statistic, Progress } from 'antd';
import { RiseOutlined, ArrowDownOutlined, TrophyOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MOCK_PROGRESS_DATA } from '../data/mockData';

const { Title, Text } = Typography;

export default function ProgressPage() {
  const data = MOCK_PROGRESS_DATA;

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, color: '#0C447C' }}>
          PROGRESS & GAP REDUCTION
        </Title>
        <Text type="secondary">
          Track overall competency accumulation and gap reduction milestones.
        </Text>
      </div>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Statistic title="Initial Competency Gap" value={data.initial_gap} suffix="pts" valueStyle={{ color: '#D97706' }} />
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Statistic title="Current Competency Gap" value={data.current_gap} suffix="pts" valueStyle={{ color: '#16A34A' }} />
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Statistic
              title="Total Gap Reduction"
              value={data.gap_reduction}
              suffix="pts"
              prefix={<ArrowDownOutlined style={{ color: '#16A34A' }} />}
              valueStyle={{ color: '#16A34A', fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title="Competency Growth Trend" bordered={false} style={{ borderRadius: 10 }}>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.overall_trend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#0C447C" strokeWidth={3} name="Competency Score %" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Gap Reduction Trajectory" bordered={false} style={{ borderRadius: 10 }}>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.overall_trend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="gap" fill="#D97706" name="Remaining Gap (pts)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
