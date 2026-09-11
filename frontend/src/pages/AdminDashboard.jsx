/**
 * AdminDashboard — Training Intelligence overview for MoSPI / NSSTA leadership.
 */

import React, { useState } from 'react';
import {
  Row,
  Col,
  Card,
  Table,
  Tag,
  Statistic,
  Space,
  Typography,
  Alert,
  Select,
} from 'antd';
import {
  TeamOutlined,
  BarChartOutlined,
  RiseOutlined,
  BankOutlined,
  SafetyCertificateOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { MOCK_ADMIN_INTELLIGENCE } from '../data/mockData';

const { Title, Text, Paragraph } = Typography;

export default function AdminDashboard() {
  const intel = MOCK_ADMIN_INTELLIGENCE;
  const [selectedDepartment, setSelectedDepartment] = useState('All');

  const gapColumns = [
    {
      title: 'Competency Area',
      dataIndex: 'competency',
      key: 'competency',
      render: (t) => <Text strong style={{ color: '#0C447C' }}>{t}</Text>,
    },
    {
      title: 'Avg Gap (pts)',
      dataIndex: 'gap',
      key: 'gap',
      align: 'center',
      render: (g) => <Text style={{ color: '#D97706', fontWeight: 700 }}>{g}</Text>,
    },
    {
      title: 'Officers Affected',
      dataIndex: 'officers',
      key: 'officers',
      align: 'center',
      render: (o) => <Text style={{ fontWeight: 600 }}>{o} officers</Text>,
    },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1280, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#0C447C' }}>
            TRAINING INTELLIGENCE
          </Title>
          <Text type="secondary">
            Org-wide competency gap distributions, pre/post training improvement, and cohort demands for MoSPI/NSSTA.
          </Text>
        </div>

        <Space>
          <Text style={{ fontSize: 12, color: '#64748B' }}>Department Cohort:</Text>
          <Select
            value={selectedDepartment}
            onChange={setSelectedDepartment}
            style={{ width: 220 }}
            options={[
              { value: 'All', label: 'All Statistical Divisions' },
              { value: 'Industrial', label: 'Industrial Statistics Division' },
              { value: 'Price', label: 'Price Statistics Division' },
              { value: 'Labour', label: 'Labour Statistics Division' },
            ]}
          />
        </Space>
      </div>

      <Alert
        message="MoSPI Aggregate Outcome Analytics"
        description="Aggregated view of organizational capability trends. Individual PII is anonymized in leadership reporting views."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* 4 Top KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Statistic
              title="Total Officers Tracked"
              value={intel.kpis.total_officers}
              prefix={<TeamOutlined style={{ color: '#0C447C' }} />}
              valueStyle={{ color: '#0C447C', fontWeight: 700 }}
            />
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Statistic
              title="Active Learners"
              value={intel.kpis.active_learners}
              prefix={<BankOutlined style={{ color: '#16A34A' }} />}
              valueStyle={{ color: '#16A34A', fontWeight: 700 }}
            />
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Statistic
              title="Average Competency"
              value={intel.kpis.avg_competency}
              suffix="%"
              valueStyle={{ color: '#334155', fontWeight: 700 }}
            />
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderLeft: '4px solid #16A34A' }}>
            <Statistic
              title="Average Improvement"
              value={intel.kpis.avg_improvement}
              prefix="+"
              suffix="pts"
              valueStyle={{ color: '#16A34A', fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Demand Insights Alert */}
      <Alert
        message="Training Demand Insight"
        description={intel.demand_insights}
        type="warning"
        icon={<BulbOutlined />}
        showIcon
        style={{ marginBottom: 24, borderRadius: 8 }}
      />

      {/* Charts */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Pre vs Post Competency Improvement" bordered={false} style={{ borderRadius: 10 }}>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={intel.pre_post_improvement}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="competency" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="pre" fill="#94A3B8" name="Pre-Training Score" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="post" fill="#0C447C" name="Post-Training Score" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Top Competency Gaps (Org-Wide)" bordered={false} style={{ borderRadius: 10 }}>
            <Table dataSource={intel.top_gaps} columns={gapColumns} pagination={false} rowKey="competency" />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
