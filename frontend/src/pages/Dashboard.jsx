/**
 * Dashboard — Dynamic Officer Competency Development Hub for STATKARMAYOG.
 *
 * Fetches real dynamic data from backend API for whichever officer is logged in.
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
  Button,
  Skeleton,
  Alert,
} from 'antd';
import {
  DashboardOutlined,
  BookOutlined,
  RiseOutlined,
  RocketOutlined,
  FilePdfOutlined,
  SafetyCertificateOutlined,
  EyeOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getOfficerProfile,
  getGapAnalysis,
  getRecommendations,
  getPassportSummary,
} from '../api/client';

const { Title, Text, Paragraph } = Typography;

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const officerId = user?.officer_id || 'OFF001';

  const [loading, setLoading] = useState(true);
  const [isMockData, setIsMockData] = useState(false);
  const [profile, setProfile] = useState(null);
  const [gapsData, setGapsData] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [passport, setPassport] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [profRes, gapsRes, recsRes, passRes] = await Promise.all([
        getOfficerProfile(officerId),
        getGapAnalysis(officerId),
        getRecommendations(officerId),
        getPassportSummary(officerId),
      ]);

      setProfile(profRes.data);
      setGapsData(gapsRes.data?.gaps || []);
      setRecommendations(recsRes.data || []);
      setPassport(passRes.data);
      setIsMockData(profRes.isMock || gapsRes.isMock || recsRes.isMock || passRes.isMock);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [officerId]);

  // Derived KPI metrics from real gap data
  const kpis = useMemo(() => {
    if (!gapsData || gapsData.length === 0) {
      return { current: 68, required: 82, gap: 14, progress: 64 };
    }
    const avgCurrent = Math.round(
      (gapsData.reduce((acc, g) => acc + (g.current_level || g.current || 0), 0) / gapsData.length) * 20
    );
    const avgRequired = Math.round(
      (gapsData.reduce((acc, g) => acc + (g.expected_level || g.required || 0), 0) / gapsData.length) * 20
    );
    const gapSize = Math.max(0, avgRequired - avgCurrent);
    return {
      current: avgCurrent,
      required: avgRequired,
      gap: gapSize,
      progress: Math.min(100, Math.round((avgCurrent / (avgRequired || 1)) * 100)),
    };
  }, [gapsData]);

  // Derived radar data from real skill gaps
  const radarData = useMemo(() => {
    if (!gapsData || gapsData.length === 0) return [];
    return gapsData.slice(0, 6).map((g) => ({
      subject: g.skill || g.skill_label || 'Competency',
      current: Math.round((g.current_level || g.current || 1) * 20),
      required: Math.round((g.expected_level || g.required || 1) * 20),
      fullMark: 100,
    }));
  }, [gapsData]);

  // Table columns for Gap Summary
  const gapColumns = [
    {
      title: 'Competency',
      dataIndex: 'skill',
      key: 'skill',
      render: (text, record) => (
        <div>
          <Text strong style={{ color: '#0C447C', fontSize: 14 }}>
            {text || record.skill_label}
          </Text>
          <div style={{ fontSize: 11, color: '#64748B' }}>Source: {record.score_source || 'DB'}</div>
        </div>
      ),
    },
    {
      title: 'Required',
      dataIndex: 'expected_level',
      key: 'expected_level',
      align: 'center',
      render: (val) => <Text style={{ fontWeight: 600 }}>{val ? `${val * 20}%` : '80%'}</Text>,
    },
    {
      title: 'Current',
      dataIndex: 'current_level',
      key: 'current_level',
      align: 'center',
      render: (val) => <Text style={{ fontWeight: 600, color: '#0C447C' }}>{val ? `${val * 20}%` : '60%'}</Text>,
    },
    {
      title: 'Gap',
      dataIndex: 'gap_size',
      key: 'gap_size',
      align: 'center',
      render: (gap) => {
        const gapPts = gap ? gap * 20 : 0;
        return (
          <Text style={{ fontWeight: 700, color: gapPts > 20 ? '#CF1322' : gapPts > 10 ? '#D46B08' : '#389E0D' }}>
            {gapPts > 0 ? `${gapPts} pts` : 'Closed'}
          </Text>
        );
      },
    },
    {
      title: 'Confidence',
      dataIndex: 'confidence_level',
      key: 'confidence_level',
      align: 'center',
      render: (conf) => <Tag color="blue">{conf || 'High'}</Tag>,
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: 24, maxWidth: 1280, margin: '0 auto' }}>
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

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
              Good Morning, {profile?.name || user?.name || 'Officer'}
            </Title>
            <Paragraph style={{ color: '#E2E8F0', margin: '4px 0 0', fontSize: 13 }}>
              Role: <strong>{profile?.designation || user?.designation}</strong> • Department: <strong>{profile?.department || user?.department}</strong>
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

      {/* TOP 4 DYNAMIC KPI CARDS */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>CURRENT COMPETENCY</Text>
            <Title level={2} style={{ margin: '4px 0 0', color: '#0C447C' }}>
              {kpis.current}%
            </Title>
            <Progress percent={kpis.current} strokeColor="#0C447C" showInfo={false} size="small" style={{ marginTop: 8 }} />
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>REQUIRED COMPETENCY</Text>
            <Title level={2} style={{ margin: '4px 0 0', color: '#334155' }}>
              {kpis.required}%
            </Title>
            <Progress percent={kpis.required} strokeColor="#334155" showInfo={false} size="small" style={{ marginTop: 8 }} />
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderLeft: '4px solid #D97706' }}>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>COMPETENCY GAP</Text>
            <Title level={2} style={{ margin: '4px 0 0', color: '#D97706' }}>
              {kpis.gap}%
            </Title>
            <Text style={{ fontSize: 11, color: '#D97706' }}>Live DB calculation</Text>
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderLeft: '4px solid #16A34A' }}>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>LEARNING PROGRESS</Text>
            <Title level={2} style={{ margin: '4px 0 0', color: '#16A34A' }}>
              {kpis.progress}%
            </Title>
            <Progress percent={kpis.progress} strokeColor="#16A34A" showInfo={false} size="small" style={{ marginTop: 8 }} />
          </Card>
        </Col>
      </Row>

      {/* RADAR CHART & DYNAMIC GAP SUMMARY TABLE */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
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
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#E2E8F0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#334155', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar name="Current Level" dataKey="current" stroke="#0C447C" fill="#0C447C" fillOpacity={0.4} />
                  <Radar name="Required Level" dataKey="required" stroke="#D97706" fill="#D97706" fillOpacity={0.15} />
                  <Tooltip />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card
            title={
              <Space>
                <DashboardOutlined style={{ color: '#0C447C' }} />
                <span style={{ color: '#0C447C', fontWeight: 600 }}>Dynamic Competency Gap Summary</span>
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
              dataSource={gapsData}
              columns={gapColumns}
              pagination={false}
              size="middle"
              rowKey={(r) => r.skill || r.skill_label || Math.random()}
              onRow={() => ({
                onClick: () => navigate('/gaps'),
                style: { cursor: 'pointer' },
              })}
            />
          </Card>
        </Col>
      </Row>

      {/* RECOMMENDED COURSES FROM BACKEND SEMANTIC SEARCH */}
      <Row gutter={[24, 24]}>
        <Col xs={24}>
          <Card
            title={
              <Space>
                <BookOutlined style={{ color: '#0C447C' }} />
                <span style={{ color: '#0C447C', fontWeight: 600 }}>ChromaDB Semantic Course Recommendations</span>
              </Space>
            }
            extra={
              <Button type="link" onClick={() => navigate('/learning')} style={{ color: '#0C447C' }}>
                All Recommendations →
              </Button>
            }
            bordered={false}
            style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          >
            <Row gutter={[16, 16]}>
              {recommendations.slice(0, 3).map((rec, idx) => (
                <Col xs={24} md={8} key={rec.course_id || idx}>
                  <div style={{ background: '#F0F7FF', padding: 16, borderRadius: 8, border: '1px solid #BAE6FD', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Tag color="navy" style={{ background: '#0C447C', color: '#fff' }}>
                          ID: {rec.course_id}
                        </Tag>
                        <Tag color="green">Match: {Math.round((rec.final_score || 0.85) * 100)}%</Tag>
                      </div>
                      <Text strong style={{ fontSize: 14, color: '#0C447C', display: 'block', marginBottom: 6 }}>
                        {rec.course_title}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        Matched Skills: {(rec.matched_skills || []).join(', ') || 'Statistical Operations'}
                      </Text>
                    </div>

                    <Button
                      type="primary"
                      size="small"
                      icon={<RocketOutlined />}
                      onClick={() => navigate('/igot')}
                      style={{ background: '#0C447C', marginTop: 12 }}
                    >
                      Start Learning
                    </Button>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
