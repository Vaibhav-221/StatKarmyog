import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, Typography, Tag, Button, Space, Progress, Skeleton, Empty } from 'antd';
import { ArrowLeftOutlined, ThunderboltOutlined, RocketOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getArtifactDetail,
  getOfficerArtifactGaps,
  getOfficerArtifactRecommendations,
} from '../api/client';

const { Title, Text, Paragraph } = Typography;

function gapColor(status) {
  if (status === 'Critical Gap') return 'red';
  if (status === 'High Gap') return 'volcano';
  if (status === 'Moderate Gap') return 'orange';
  return 'green';
}

export default function WorkArtifactDetail() {
  const { artifactId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const officerId = user?.officer_id || 'OFF001';
  const [loading, setLoading] = useState(true);
  const [artifact, setArtifact] = useState(null);
  const [gaps, setGaps] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [artifactRes, gapRes, recRes] = await Promise.all([
        getArtifactDetail(artifactId),
        getOfficerArtifactGaps(officerId, artifactId),
        getOfficerArtifactRecommendations(officerId, artifactId),
      ]);
      setArtifact(artifactRes.data);
      setGaps(gapRes.data || []);
      setRecommendations(recRes.data || []);
      setLoading(false);
    }
    load();
  }, [artifactId, officerId]);

  const recommendationByCid = useMemo(() => {
    const grouped = {};
    recommendations.forEach((rec) => {
      if (!grouped[rec.cid]) grouped[rec.cid] = rec;
    });
    return grouped;
  }, [recommendations]);

  const startQuiz = (gap) => {
    const params = new URLSearchParams({
      competency: gap.competency,
      artifact_id: gap.artifact_id,
    });
    navigate(`/quiz?${params.toString()}`);
  };

  if (loading) {
    return (
      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  if (!artifact) {
    return (
      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <Card bordered={false} style={{ borderRadius: 10 }}>
          <Empty description="Artifact not found" />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/artifacts')} style={{ marginBottom: 16 }}>
        Back to Work Artifacts
      </Button>

      <Card bordered={false} style={{ borderRadius: 10, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <Row gutter={[24, 16]} justify="space-between">
          <Col xs={24} lg={16}>
            <Title level={3} style={{ color: '#0C447C', marginTop: 0 }}>{artifact.title}</Title>
            <Paragraph style={{ color: '#475569' }}>{artifact.description}</Paragraph>
            <Space wrap>
              <Tag color="blue">{artifact.artifact_type}</Tag>
              <Tag color="gold">{artifact.domain}</Tag>
              <Tag color="purple">{artifact.difficulty}</Tag>
              <Tag color="green">{artifact.status}</Tag>
            </Space>
          </Col>
          <Col xs={24} lg={8}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <div><Text type="secondary">Department</Text><div><Text strong>{artifact.department}</Text></div></div>
              <div><Text type="secondary">Role</Text><div><Text strong>{artifact.role}</Text></div></div>
              <div><Text type="secondary">Skills</Text><div>{(artifact.skills || []).map((skill) => <Tag key={skill}>{skill}</Tag>)}</div></div>
            </Space>
          </Col>
        </Row>
      </Card>

      <Title level={4} style={{ color: '#0C447C' }}>Required Competencies & Gaps</Title>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {gaps.map((gap) => {
          const rec = recommendationByCid[gap.cid];
          return (
            <Card
              key={`${gap.artifact_id}-${gap.cid}-${gap.display_competency}`}
              bordered={false}
              style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderLeft: `4px solid ${gap.gap > 40 ? '#DC2626' : gap.gap > 25 ? '#EA580C' : gap.gap > 10 ? '#D97706' : '#16A34A'}` }}
            >
              <Row gutter={[24, 16]} align="middle">
                <Col xs={24} lg={8}>
                  <Text strong style={{ color: '#0C447C', fontSize: 16 }}>{gap.display_competency}</Text>
                  <div style={{ marginTop: 4 }}>
                    <Text type="secondary">Mapped to {gap.competency}</Text>
                  </div>
                  <Tag color={gapColor(gap.gap_status)} style={{ marginTop: 8 }}>{gap.gap_status}</Tag>
                </Col>
                <Col xs={24} lg={8}>
                  <Row gutter={16}>
                    <Col span={8}><Text type="secondary">Required</Text><div><Text strong>{gap.required_percent}%</Text></div></Col>
                    <Col span={8}><Text type="secondary">Current</Text><div><Text strong>{gap.current_percent}%</Text></div></Col>
                    <Col span={8}><Text type="secondary">Gap</Text><div><Text strong style={{ color: gap.gap > 25 ? '#DC2626' : '#D97706' }}>{gap.gap}%</Text></div></Col>
                  </Row>
                  <Progress percent={gap.current_percent} success={{ percent: Math.min(gap.current_percent, gap.required_percent) }} showInfo={false} style={{ marginTop: 10 }} />
                </Col>
                <Col xs={24} lg={8}>
                  {rec ? (
                    <div style={{ background: '#F8FAFC', borderRadius: 8, padding: 12 }}>
                      <Space direction="vertical" size={6} style={{ width: '100%' }}>
                        <Text strong><RocketOutlined /> {rec.course_title}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>{rec.reason}</Text>
                        <Button type="link" onClick={() => navigate('/learning')} style={{ padding: 0, color: '#0C447C' }}>
                          View Recommended Learning
                        </Button>
                      </Space>
                    </div>
                  ) : (
                    <Text type="secondary">No matching course found in catalogue for this competency.</Text>
                  )}
                  <Button
                    type="primary"
                    icon={<ThunderboltOutlined />}
                    onClick={() => startQuiz(gap)}
                    style={{ background: '#0C447C', width: '100%', marginTop: 12 }}
                  >
                    Generate Quiz
                  </Button>
                </Col>
              </Row>
            </Card>
          );
        })}
      </Space>
    </div>
  );
}
