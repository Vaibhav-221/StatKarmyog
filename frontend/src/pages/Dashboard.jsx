/**
 * Dashboard — Primary Officer Competency Development Hub for STATKARMAYOG.
 *
 * Implements the core value story:
 * "FROM IDENTIFYING COMPETENCY GAPS -> TO PROVING COMPETENCY IMPROVEMENT"
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  Row,
  Col,
  Card,
  Table,
  Tag,
  Progress,
  Space,
  Typography,
  Avatar,
  Button,
  Statistic,
  Divider,
  Alert,
} from 'antd';
import {
  UserOutlined,
  DashboardOutlined,
  BookOutlined,
  RiseOutlined,
  RocketOutlined,
  FilePdfOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SafetyCertificateOutlined,
  EyeOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  MOCK_OFFICER_PROFILE,
  MOCK_RADAR_DATA,
  MOCK_GAP_TABLE,
  MOCK_RECENT_EVIDENCE,
  MOCK_RECOMMENDED_COURSES,
  MOCK_PASSPORT_DATA,
} from '../data/mockData';

const { Title, Text, Paragraph } = Typography;

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const officer = {
    name: user?.name || MOCK_OFFICER_PROFILE.name,
    designation: user?.designation || MOCK_OFFICER_PROFILE.designation,
    department: user?.department || MOCK_OFFICER_PROFILE.department,
  };

  const kpis = MOCK_OFFICER_PROFILE.current_kpis;

  // Table columns for Competency Gap Summary
  const gapColumns = [
    {
      title: 'Competency',
      dataIndex: 'competency',
      key: 'competency',
      render: (text, record) => (
        <div>
          <Text strong style={{ color: '#0C447C', fontSize: 14 }}>
            {text}
          </Text>
          <div style={{ fontSize: 11, color: '#64748B' }}>{record.cid}</div>
        </div>
      ),
    },
    {
      title: 'Required',
      dataIndex: 'required',
      key: 'required',
      align: 'center',
      render: (val) => <Text style={{ fontWeight: 600 }}>{val}%</Text>,
    },
    {
      title: 'Current',
      dataIndex: 'current',
      key: 'current',
      align: 'center',
      render: (val) => <Text style={{ fontWeight: 600, color: '#0C447C' }}>{val}%</Text>,
    },
    {
      title: 'Gap',
      dataIndex: 'gap',
      key: 'gap',
      align: 'center',
      render: (gap) => (
        <Text style={{ fontWeight: 700, color: gap > 20 ? '#CF1322' : gap > 10 ? '#D46B08' : '#389E0D' }}>
          {gap > 0 ? `${gap} pts` : '0 pts'}
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      render: (status) => (
        <Tag color={status === 'High Gap' ? 'error' : status === 'Moderate Gap' ? 'warning' : 'success'}>
          {status}
        </Tag>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1280, margin: '0 auto' }}>
      {/* Header Banner */}
      <Card
        bordered={false}
        style={{
          background: 'linear-gradient(135deg, #0C447C 0%, #1E5AA8 100%)',
          borderRadius: 12,
          marginBottom: 24,
          boxShadow: '0 4px 14px rgba(12,68,124,0.15)',
        }}
      >
        <Row align="middle" justify="space-between" gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <Title level={3} style={{ color: '#fff', margin: 0 }}>
              Good Morning, {officer.name}
            </Title>
            <Paragraph style={{ color: '#E2E8F0', margin: '4px 0 0', fontSize: 13 }}>
              Role: <strong>{officer.designation}</strong> • Department: <strong>{officer.department}</strong>
            </Paragraph>
          </Col>

          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              icon={<SafetyCertificateOutlined />}
              onClick={() => navigate('/passport')}
              style={{ background: '#fff', color: '#0C447C', fontWeight: 600, border: 'none' }}
            >
              View Competency Passport
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 6.1 TOP 4 KPI CARDS */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>CURRENT COMPETENCY</Text>
            <Title level={2} style={{ margin: '4px 0 0', color: '#0C447C' }}>
              {kpis.current_competency}%
            </Title>
            <Progress percent={kpis.current_competency} strokeColor="#0C447C" showInfo={false} size="small" style={{ marginTop: 8 }} />
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>REQUIRED COMPETENCY</Text>
            <Title level={2} style={{ margin: '4px 0 0', color: '#334155' }}>
              {kpis.required_competency}%
            </Title>
            <Progress percent={kpis.required_competency} strokeColor="#334155" showInfo={false} size="small" style={{ marginTop: 8 }} />
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderLeft: '4px solid #D97706' }}>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>COMPETENCY GAP</Text>
            <Title level={2} style={{ margin: '4px 0 0', color: '#D97706' }}>
              {kpis.competency_gap}%
            </Title>
            <Text style={{ fontSize: 11, color: '#D97706' }}>Target reduction active</Text>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderLeft: '4px solid #16A34A' }}>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>LEARNING PROGRESS</Text>
            <Title level={2} style={{ margin: '4px 0 0', color: '#16A34A' }}>
              {kpis.learning_progress}%
            </Title>
            <Progress percent={kpis.learning_progress} strokeColor="#16A34A" showInfo={false} size="small" style={{ marginTop: 8 }} />
          </Card>
        </Col>
      </Row>

      {/* 6.2 RADAR CHART & 6.3 GAP SUMMARY TABLE */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        {/* Left: Radar Chart */}
        <Col xs={24} lg={10}>
          <Card
            title={
              <Space>
                <RiseOutlined style={{ color: '#0C447C' }} />
                <span style={{ color: '#0C447C', fontWeight: 600 }}>Competency Radar Overview</span>
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', height: '100%' }}
          >
            <div style={{ height: 320, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={MOCK_RADAR_DATA}>
                  <PolarGrid stroke="#E2E8F0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#334155', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar name="Current Competency" dataKey="current" stroke="#0C447C" fill="#0C447C" fillOpacity={0.4} />
                  <Radar name="Required Competency" dataKey="required" stroke="#D97706" fill="#D97706" fillOpacity={0.15} />
                  <Tooltip />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* Right: Gap Table */}
        <Col xs={24} lg={14}>
          <Card
            title={
              <Space>
                <DashboardOutlined style={{ color: '#0C447C' }} />
                <span style={{ color: '#0C447C', fontWeight: 600 }}>Competency Gap Summary</span>
              </Space>
            }
            extra={
              <Button type="link" onClick={() => navigate('/gaps')} style={{ color: '#0C447C' }}>
                Full Diagnostic →
              </Button>
            }
            bordered={false}
            style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', height: '100%' }}
          >
            <Table
              dataSource={MOCK_GAP_TABLE}
              columns={gapColumns}
              pagination={false}
              size="middle"
              rowKey="key"
              onRow={(record) => ({
                onClick: () => navigate('/gaps'),
                style: { cursor: 'pointer' },
              })}
            />
          </Card>
        </Col>
      </Row>

      {/* 6.4 RECENT EVIDENCE & 6.5 RECOMMENDED LEARNING */}
      <Row gutter={[24, 24]}>
        {/* Recent Evidence */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <FilePdfOutlined style={{ color: '#0C447C' }} />
                <span style={{ color: '#0C447C', fontWeight: 600 }}>Recent Work Evidence</span>
              </Space>
            }
            extra={
              <Button type="link" onClick={() => navigate('/upload-artifact')} style={{ color: '#0C447C' }}>
                Upload New →
              </Button>
            }
            bordered={false}
            style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              {MOCK_RECENT_EVIDENCE.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: '#F8FAFC',
                    padding: 14,
                    borderRadius: 8,
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <Text strong style={{ fontSize: 14, color: '#0C447C' }}>
                      {item.document_name}
                    </Text>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                      Uploaded: {item.upload_date} • Confidence:{' '}
                      <Tag color="blue" style={{ marginLeft: 4 }}>
                        {item.confidence}
                      </Tag>
                    </div>
                    <div style={{ marginTop: 6 }}>
                      {item.competencies_detected.map((c, i) => (
                        <Tag key={i} color="geekblue" style={{ fontSize: 10 }}>
                          {c}
                        </Tag>
                      ))}
                    </div>
                  </div>

                  <Button
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => navigate('/evidence-history')}
                    style={{ borderColor: '#0C447C', color: '#0C447C' }}
                  >
                    View
                  </Button>
                </div>
              ))}
            </Space>
          </Card>
        </Col>

        {/* Recommended Learning */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <BookOutlined style={{ color: '#0C447C' }} />
                <span style={{ color: '#0C447C', fontWeight: 600 }}>Recommended Learning</span>
              </Space>
            }
            extra={
              <Button type="link" onClick={() => navigate('/learning')} style={{ color: '#0C447C' }}>
                All Courses →
              </Button>
            }
            bordered={false}
            style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              {MOCK_RECOMMENDED_COURSES.slice(0, 2).map((course) => (
                <div
                  key={course.course_id}
                  style={{
                    background: '#F0F7FF',
                    padding: 14,
                    borderRadius: 8,
                    border: '1px solid #BAE6FD',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text strong style={{ fontSize: 14, color: '#0C447C' }}>
                      {course.title}
                    </Text>
                    <Tag color="orange">Gap: {course.gap} pts</Tag>
                  </div>

                  <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                    Competency: <strong>{course.competency}</strong> • Difficulty: {course.difficulty}
                  </Text>

                  <Paragraph style={{ fontSize: 12, color: '#334155', margin: '4px 0 12px' }}>
                    "{course.reason}"
                  </Paragraph>

                  <Button
                    type="primary"
                    size="small"
                    icon={<RocketOutlined />}
                    onClick={() => navigate('/igot')}
                    style={{ background: '#0C447C' }}
                  >
                    Start Learning
                  </Button>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
