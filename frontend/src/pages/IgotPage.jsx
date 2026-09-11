/**
 * iGOT / NSSTA Ecosystem Page — Mock learning platform integration.
 */

import React, { useState } from 'react';
import { Row, Col, Card, Typography, Tabs, Tag, Button, Progress, Alert, Space, Table } from 'antd';
import {
  BankOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  GlobalOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import { MOCK_RECOMMENDED_COURSES } from '../data/mockData';

const { Title, Text, Paragraph } = Typography;

export default function IgotPage() {
  const [activeTab, setActiveTab] = useState('igot');

  const igotCourses = [
    { key: '1', id: 'C022', title: 'Sampling Methods in Official Statistics', competency: 'Sampling Methodology', status: 'In-Progress', progress: 45 },
    { key: '2', id: 'C009', title: 'Python for Statistical Computing & Automation', competency: 'Python/Data Processing', status: 'Completed', progress: 100 },
    { key: '3', id: 'C003', title: 'SSS Induction Training - Core Statistics', competency: 'Survey Design', status: 'Enrolled', progress: 0 },
  ];

  const nsstaCourses = [
    { key: '1', id: 'N015', title: 'Advanced Statistical Data Validation Framework', competency: 'Statistical Analysis', status: 'In-Progress', progress: 60 },
    { key: '2', id: 'N008', title: 'National Accounts & Price Statistics Workshop', competency: 'Data Quality', status: 'Completed', progress: 100 },
  ];

  const columns = [
    {
      title: 'Course Title',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div>
          <Text strong style={{ color: '#0C447C' }}>{text}</Text>
          <div style={{ fontSize: 11, color: '#64748B' }}>ID: {record.id} • {record.competency}</div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      render: (st) => (
        <Tag color={st === 'Completed' ? 'success' : st === 'In-Progress' ? 'processing' : 'default'}>
          {st}
        </Tag>
      ),
    },
    {
      title: 'Progress',
      dataIndex: 'progress',
      key: 'progress',
      render: (p) => (
        <div style={{ minWidth: 120 }}>
          <Progress percent={p} strokeColor="#0C447C" size="small" />
        </div>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          size="small"
          style={{ background: '#0C447C' }}
        >
          {record.progress > 0 ? 'Continue' : 'Launch'}
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header with Prototype Integration Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#0C447C' }}>
            LEARNING ECOSYSTEM
          </Title>
          <Text type="secondary">
            Integration portal with iGOT Karmayogi & NSSTA Training Academies.
          </Text>
        </div>

        <Tag icon={<ApiOutlined />} color="cyan" style={{ fontSize: 12, padding: '4px 12px', borderRadius: 12 }}>
          Prototype Integration / iGOT-Compatible Mock API
        </Tag>
      </div>

      <Alert
        message="API Abstraction Layer Active"
        description="The frontend consumes an API service layer designed for the official iGOT Karmayogi OAuth2 & REST endpoints. In this prototype, mock services push enrollment progress events via webhooks."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'igot',
              label: (
                <span>
                  <GlobalOutlined /> iGOT Karmayogi Courses
                </span>
              ),
              children: <Table dataSource={igotCourses} columns={columns} pagination={false} />,
            },
            {
              key: 'nssta',
              label: (
                <span>
                  <BankOutlined /> NSSTA Academy Courses
                </span>
              ),
              children: <Table dataSource={nsstaCourses} columns={columns} pagination={false} />,
            },
          ]}
        />
      </Card>
    </div>
  );
}
