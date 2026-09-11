/**
 * Gap Analysis page — AI Competency Gap Breakdown & Root Cause Diagnostic.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, Typography, Tag, Progress, Button, Space, Empty, Skeleton } from 'antd';
import {
  WarningOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  BulbOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getGapAnalysis, getCompetencyScores } from '../api/client';

const { Title, Text, Paragraph } = Typography;

export default function GapAnalysis() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const officerId = user?.officer_id || 'OFF001';
  const [loading, setLoading] = useState(true);
  const [gaps, setGaps] = useState([]);
  const [scores, setScores] = useState([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [gapRes, scoreRes] = await Promise.all([
        getGapAnalysis(officerId),
        getCompetencyScores(officerId),
      ]);
      setGaps(gapRes.data?.gaps || []);
      setScores(scoreRes.data || []);
      setLoading(false);
    }
    load();
  }, [officerId]);

  const rows = useMemo(() => {
    const latestBySkill = {};
    scores.forEach((score) => {
      const existing = latestBySkill[score.skill_label];
      if (!existing || `${score.recorded_on}-${score.id}` > `${existing.recorded_on}-${existing.id}`) {
        latestBySkill[score.skill_label] = score;
      }
    });

    return gaps.map((gap, index) => {
      const score = latestBySkill[gap.skill];
      const gapPercent = Math.max(0, Math.round(gap.gap_size * 20));
      return {
        key: gap.skill || index,
        cid: score?.cid || gap.skill,
        competency: gap.skill,
        required: Math.round(gap.expected_level * 20),
        current: Math.round(gap.current_level * 20),
        gap: gapPercent,
        status: gapPercent > 20 ? 'High Gap' : gapPercent > 5 ? 'Moderate Gap' : 'Near Target',
        confidence: gap.confidence_level,
        knowledge: score?.quiz_score !== null && score?.quiz_score !== undefined ? Math.round(score.quiz_score * 20) : null,
        artifact: score?.artifact_score !== null && score?.artifact_score !== undefined ? Math.round(score.artifact_score * 20) : null,
      };
    });
  }, [gaps, scores]);

  const highestGap = rows[0];
  const nearTargetCount = rows.filter((item) => item.gap <= 10).length;

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, color: '#0C447C' }}>
          AI Competency Gap Analysis
        </Title>
        <Text type="secondary">
          Granular diagnostic comparing required role expectations against multi-source evidence scores.
        </Text>
      </div>

      {/* Top Banner Overview */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <Card bordered={false} style={{ background: '#F0F7FF', border: '1px solid #BAE6FD', borderRadius: 10 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>TOTAL TRACKED COMPETENCIES</Text>
            <Title level={2} style={{ margin: '4px 0 0', color: '#0C447C' }}>
              {rows.length} Areas
            </Title>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card bordered={false} style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>HIGHEST GAP IDENTIFIED</Text>
            <Title level={2} style={{ margin: '4px 0 0', color: '#D97706' }}>
              {highestGap ? `${highestGap.gap} Points` : 'No gap'}
            </Title>
            <Text style={{ fontSize: 12, color: '#92400E' }}>{highestGap?.competency || 'All tracked competencies are at target'}</Text>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card bordered={false} style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>COMPETENCIES NEAR TARGET</Text>
            <Title level={2} style={{ margin: '4px 0 0', color: '#16A34A' }}>
              {nearTargetCount} Areas
            </Title>
          </Card>
        </Col>
      </Row>

      {/* Detailed Diagnostic Cards per Competency */}
      <Title level={4} style={{ color: '#0C447C', marginBottom: 16 }}>
        Competency Diagnostics & Evidence Breakdown
      </Title>

      <Space direction="vertical" style={{ width: '100%' }} size={16}>
        {loading ? (
          <Card bordered={false} style={{ borderRadius: 10 }}>
            <Skeleton active paragraph={{ rows: 8 }} />
          </Card>
        ) : rows.length === 0 ? (
          <Card bordered={false} style={{ borderRadius: 10 }}>
            <Empty description="No competency gaps found for this officer" />
          </Card>
        ) : rows.map((item) => (
          <Card
            key={item.cid}
            bordered={false}
            style={{
              borderRadius: 10,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              borderLeft: `4px solid ${item.gap > 20 ? '#DC2626' : item.gap > 10 ? '#D97706' : '#16A34A'}`,
            }}
          >
            <Row gutter={[24, 16]} align="middle">
              {/* Left: Competency Name & Scores */}
              <Col xs={24} md={8}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text strong style={{ fontSize: 16, color: '#0C447C' }}>
                    {item.competency}
                  </Text>
                  <Tag color={item.status === 'High Gap' ? 'error' : item.status === 'Moderate Gap' ? 'warning' : 'success'}>
                    {item.status}
                  </Tag>
                </div>

                <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 11 }}>REQUIRED</Text>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#334155' }}>{item.required}%</div>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 11 }}>CURRENT</Text>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#0C447C' }}>{item.current}%</div>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 11 }}>GAP</Text>
                    <div style={{ fontSize: 18, fontWeight: 700, color: item.gap > 15 ? '#DC2626' : '#D97706' }}>
                      -{item.gap}%
                    </div>
                  </div>
                </div>

                <Progress
                  percent={item.current}
                  strokeColor={item.gap > 20 ? '#DC2626' : item.gap > 10 ? '#D97706' : '#16A34A'}
                  showInfo={false}
                />
              </Col>

              {/* Middle: WHY THIS GAP? Evidence diagnostic */}
              <Col xs={24} md={10} style={{ borderLeft: '1px solid #F1F5F9', borderRight: '1px solid #F1F5F9', padding: '0 20px' }}>
                <Text strong style={{ fontSize: 12, color: '#475569', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <BulbOutlined style={{ color: '#D97706' }} /> WHY THIS GAP?
                </Text>

                <Row gutter={[12, 8]}>
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: 11 }}>Knowledge Assessment:</Text>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{item.knowledge === null ? 'Not assessed' : `${item.knowledge}%`}</div>
                  </Col>
                  <Col span={12}>
                    <Text type="secondary" style={{ fontSize: 11 }}>Work Artifact Evidence:</Text>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{item.artifact === null ? 'No evidence' : `${item.artifact}%`}</div>
                  </Col>
                  <Col span={24}>
                    <Text type="secondary" style={{ fontSize: 11 }}>Evidence Confidence: </Text>
                    <Tag color="blue" style={{ marginLeft: 4 }}>{item.confidence}</Tag>
                  </Col>
                </Row>
              </Col>

              {/* Right: Recommended Action & Button */}
              <Col xs={24} md={6} style={{ textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 8 }}>
                  RECOMMENDED ACTION
                </Text>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#0C447C', marginBottom: 12 }}>
                  Targeted learning in {item.competency}
                </div>
                <Button
                  type="primary"
                  icon={<RocketOutlined />}
                  onClick={() => navigate('/learning')}
                  style={{ background: '#0C447C', width: '100%' }}
                >
                  View Recommended Learning
                </Button>
              </Col>
            </Row>
          </Card>
        ))}
      </Space>
    </div>
  );
}
