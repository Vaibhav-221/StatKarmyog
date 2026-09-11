/**
 * My Competencies page — Detailed breakdown of officer competencies with scoring modal.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, Typography, Progress, Tag, Button, Modal, Table, Space, Alert, Empty, Skeleton } from 'antd';
import {
  InfoCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CalculatorOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { getGapAnalysis, getCompetencyScores } from '../api/client';

const { Title, Text, Paragraph } = Typography;

export default function MyCompetencies() {
  const { user } = useAuth();
  const officerId = user?.officer_id || 'OFF001';
  const [modalVisible, setModalVisible] = useState(false);
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
      const required = Math.round(gap.expected_level * 20);
      const current = Math.round(gap.current_level * 20);
      const gapPercent = Math.max(0, Math.round(gap.gap_size * 20));
      return {
        key: gap.skill || index,
        cid: score?.cid || '',
        competency: gap.skill,
        required,
        current,
        gap: gapPercent,
        status: gapPercent > 20 ? 'High Gap' : gapPercent > 5 ? 'Moderate Gap' : 'Near Target',
        confidence: gap.confidence_level,
        knowledge: score?.quiz_score !== null && score?.quiz_score !== undefined ? Math.round(score.quiz_score * 20) : null,
        artifact: score?.artifact_score !== null && score?.artifact_score !== undefined ? Math.round(score.artifact_score * 20) : null,
      };
    });
  }, [gaps, scores]);

  const columns = [
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
      title: 'Current Score',
      dataIndex: 'current',
      key: 'current',
      render: (val, record) => (
        <div style={{ minWidth: 140 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
          <span>{val}%</span>
            <span style={{ color: '#64748B' }}>Target: {record.required}%</span>
          </div>
          <Progress
            percent={val}
            strokeColor={val >= record.required ? '#52C41A' : val < 60 ? '#FF4D4F' : '#FAAD14'}
            showInfo={false}
          />
        </div>
      ),
    },
    {
      title: 'Gap',
      dataIndex: 'gap',
      key: 'gap',
      align: 'center',
      render: (gap) => (
        <Text style={{ fontWeight: 700, color: gap > 15 ? '#CF1322' : gap > 5 ? '#D46B08' : '#389E0D' }}>
          {gap > 0 ? `-${gap}%` : 'Closed'}
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
    {
      title: 'Evidence Confidence',
      dataIndex: 'confidence',
      key: 'confidence',
      align: 'center',
      render: (conf) => (
        <Tag icon={conf === 'High' ? <CheckCircleOutlined /> : <InfoCircleOutlined />} color={conf === 'High' ? 'blue' : 'default'}>
          {conf}
        </Tag>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#0C447C' }}>
            My Competencies
          </Title>
          <Text type="secondary">
            Verified skills tracked across assessments, work evidence, and learning.
          </Text>
        </div>

        <Button type="primary" icon={<CalculatorOutlined />} onClick={() => setModalVisible(true)} style={{ background: '#0C447C' }}>
          How is this score calculated?
        </Button>
      </div>

      {/* Competencies Table */}
      <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        {loading ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : rows.length > 0 ? (
          <Table dataSource={rows} columns={columns} pagination={false} rowKey="key" />
        ) : (
          <Empty description="No competency gaps found for this officer" />
        )}
      </Card>

      {/* Score Calculation Modal */}
      <Modal
        title={
          <Space>
            <CalculatorOutlined style={{ color: '#0C447C' }} />
            <span style={{ color: '#0C447C' }}>Competency Score Calculation Engine</span>
          </Space>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setModalVisible(false)} style={{ background: '#0C447C' }}>
            Got It
          </Button>,
        ]}
      >
        <Alert
          message="Prototype Scoring Configuration"
          description="This formula is a prototype weighted combination configured for demonstration purposes. It does NOT represent an official government standard."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Paragraph style={{ fontSize: 13, lineHeight: 1.6 }}>
          Combined competency scores are derived dynamically from multi-source evidence:
        </Paragraph>

        <div
          style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 8,
            padding: 16,
            marginBottom: 16,
            textAlign: 'center',
            fontSize: 15,
            fontWeight: 700,
            color: '#0C447C',
          }}
        >
          Combined Score = (0.6 × Quiz Score) + (0.4 × Work Artifact Score)
        </div>

        <Space direction="vertical" style={{ width: '100%' }} size={10}>
          <div>
            <Text strong>1. Knowledge Assessment / AI Quiz (60% Weight):</Text>
            <div style={{ fontSize: 12, color: '#64748B' }}>Evaluates theoretical mastery of statistical principles and concepts.</div>
          </div>
          <div>
            <Text strong>2. Work Artifact Evidence (40% Weight):</Text>
            <div style={{ fontSize: 12, color: '#64748B' }}>Extracts and scores applied competency from uploaded sampling plans, reports, and survey designs.</div>
          </div>
          <div>
            <Text strong>3. Confidence Levels:</Text>
            <div style={{ fontSize: 12, color: '#64748B' }}>Single-source scores start as 'Low/Medium' confidence. Multi-source evidence upgrades confidence to 'High'.</div>
          </div>
        </Space>
      </Modal>
    </div>
  );
}
