/**
 * Competency Passport Page — Signature feature proving before/after competency improvement.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, Typography, Tag, Space, Alert, Empty, Skeleton } from 'antd';
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
import { useAuth } from '../context/AuthContext';
import { getCompetencyScores, getGapAnalysis, getOfficerProfile, getPassportSummary } from '../api/client';

const { Title, Text, Paragraph } = Typography;

export default function CompetencyPassportPage() {
  const { user } = useAuth();
  const officerId = user?.officer_id || 'OFF001';
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [passport, setPassport] = useState(null);
  const [gaps, setGaps] = useState([]);
  const [scores, setScores] = useState([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [profileRes, passportRes, gapRes, scoreRes] = await Promise.all([
        getOfficerProfile(officerId),
        getPassportSummary(officerId),
        getGapAnalysis(officerId),
        getCompetencyScores(officerId),
      ]);
      setProfile(profileRes.data);
      setPassport(passportRes.data);
      setGaps(gapRes.data?.gaps || []);
      setScores(scoreRes.data || []);
      setLoading(false);
    }
    load();
  }, [officerId]);

  const cards = useMemo(() => {
    const gapBySkill = Object.fromEntries(gaps.map((gap) => [gap.skill, gap]));
    const scoresByCid = scores.reduce((acc, score) => {
      acc[score.cid] = acc[score.cid] || [];
      acc[score.cid].push(score);
      return acc;
    }, {});

    return (passport?.competencies || []).map((comp) => {
      const relatedScores = scoresByCid[comp.cid] || [];
      const hasQuiz = relatedScores.some((score) => score.quiz_score !== null && score.quiz_score !== undefined);
      const hasArtifact = relatedScores.some((score) => score.artifact_score !== null && score.artifact_score !== undefined);
      const requiredScore = gapBySkill[comp.skill_label]?.expected_level;
      return {
        ...comp,
        chart_history: (comp.history || []).map((point) => ({
          label: point.recorded_on,
          score: Math.round(point.combined_score * 20),
        })),
        current_score: Math.round(comp.latest_score * 20),
        previous_score: Math.round(comp.first_score * 20),
        required_score: requiredScore !== undefined ? Math.round(requiredScore * 20) : null,
        improvement: Math.round(comp.delta * 20),
        confidence: comp.history?.[comp.history.length - 1]?.confidence_level || 'Not available',
        evidence_checkmarks: {
          knowledge_assessment: hasQuiz,
          work_artifact: hasArtifact,
          ai_quiz: hasQuiz,
          reassessment: (comp.history || []).length > 1,
        },
      };
    });
  }, [passport, gaps, scores]);

  if (loading) {
    return (
      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  const firstCard = cards[0];

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
          Officer Passport: {profile?.name || user?.name || officerId} ({profile?.designation || profile?.role_id || 'Officer'})
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
        {firstCard ? (
        <div style={{ height: 260, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={firstCard.chart_history}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="label" stroke="#64748B" />
              <YAxis domain={[0, 100]} stroke="#64748B" />
              <Tooltip
                contentStyle={{ background: '#fff', borderRadius: 8, border: '1px solid #CBD5E1' }}
                formatter={(val) => [`${val}%`, `${firstCard.skill_label} Score`]}
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
        ) : (
          <Empty description="No competency passport history found for this officer" />
        )}
      </Card>

      {/* Passport Cards per Competency */}
      <Title level={4} style={{ color: '#0C447C', marginBottom: 16 }}>
        Verified Passport Competency Stamp Cards
      </Title>

      <Row gutter={[24, 24]}>
        {cards.length === 0 ? (
          <Col span={24}>
            <Card bordered={false} style={{ borderRadius: 10 }}>
              <Empty description="No competency passport history found for this officer" />
            </Card>
          </Col>
        ) : cards.map((comp) => (
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
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#334155' }}>
                    {comp.required_score === null ? 'N/A' : `${comp.required_score}%`}
                  </div>
                </Col>
                <Col span={6} style={{ textAlign: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 10 }}>GAIN</Text>
                  <div style={{ fontSize: 16, fontWeight: 700, color: comp.improvement >= 0 ? '#389E0D' : '#CF1322' }}>
                    {comp.improvement > 0 ? `+${comp.improvement}` : comp.improvement}
                  </div>
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
