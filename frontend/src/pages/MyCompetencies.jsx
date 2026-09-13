/**
 * My Competencies page — Detailed breakdown of officer competencies with scoring modal.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Typography, Progress, Tag, Button, Modal, Table, Space, Alert, Empty, Skeleton } from 'antd';
import {
  InfoCircleOutlined,
  CheckCircleOutlined,
  CalculatorOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { getGapAnalysis, getCompetencyScores } from '../api/client';

const { Text, Paragraph } = Typography;

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
          <Text strong style={{ color: '#0B2641', fontSize: 14 }}>{text}</Text>
          <div style={{ fontSize: 11, color: '#617487' }}>{record.cid}</div>
        </div>
      ),
    },
    {
      title: 'Required',
      dataIndex: 'required',
      key: 'required',
      align: 'center',
      render: (val) => <Text style={{ fontWeight: 600, color: '#172B3D' }}>{val}%</Text>,
    },
    {
      title: 'Current Score',
      dataIndex: 'current',
      key: 'current',
      render: (val, record) => (
        <div style={{ minWidth: 140 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span style={{ fontWeight: 600, color: '#0B2641' }}>{val}%</span>
            <span style={{ color: '#617487' }}>Target: {record.required}%</span>
          </div>
          <Progress
            percent={val}
            strokeColor={val >= record.required ? '#3D7D70' : val < 60 ? '#DC2626' : '#D97706'}
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
        <Text style={{ fontWeight: 700, color: gap > 15 ? '#DC2626' : gap > 5 ? '#D97706' : '#3D7D70' }}>
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
        <Tag
          icon={conf === 'High' ? <CheckCircleOutlined /> : <InfoCircleOutlined />}
          color={conf === 'High' ? 'blue' : 'default'}
        >
          {conf}
        </Tag>
      ),
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0B2641] m-0">
            My Competencies
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#617487]">
            Verified skills tracked across assessments, work evidence, and learning modules.
          </p>
        </div>
        <Button
          type="primary"
          icon={<CalculatorOutlined />}
          onClick={() => setModalVisible(true)}
          className="!h-10 !rounded-xl !bg-[#2966A3] !text-sm !font-semibold hover:!bg-[#0B2641]"
        >
          How is this score calculated?
        </Button>
      </div>

      {/* Competencies Table */}
      <div className="rounded-2xl border border-[#DCE7F0] bg-white p-5 shadow-sm">
        {loading ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : rows.length > 0 ? (
          <div className="overflow-x-auto">
            <Table dataSource={rows} columns={columns} pagination={false} rowKey="key" />
          </div>
        ) : (
          <Empty description="No competency gaps found for this officer" />
        )}
      </div>

      {/* Score Calculation Modal */}
      <Modal
        title={
          <Space>
            <CalculatorOutlined style={{ color: '#0B2641' }} />
            <span style={{ color: '#0B2641', fontWeight: 700 }}>Competency Score Calculation Engine</span>
          </Space>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setModalVisible(false)} className="!bg-[#2966A3] !rounded-xl">
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
            background: '#F8FBFD',
            border: '1px solid #D1E0EE',
            borderRadius: 10,
            padding: 16,
            marginBottom: 16,
            textAlign: 'center',
            fontSize: 14,
            fontWeight: 700,
            color: '#0B2641',
          }}
        >
          Combined Score = (0.6 × Quiz Score) + (0.4 × Work Artifact Score)
        </div>

        <Space direction="vertical" style={{ width: '100%' }} size={10}>
          <div>
            <Text strong style={{ color: '#0B2641' }}>1. Knowledge Assessment / AI Quiz (60% Weight):</Text>
            <div style={{ fontSize: 12, color: '#617487' }}>Evaluates theoretical mastery of statistical principles and concepts.</div>
          </div>
          <div>
            <Text strong style={{ color: '#0B2641' }}>2. Work Artifact Evidence (40% Weight):</Text>
            <div style={{ fontSize: 12, color: '#617487' }}>Extracts and scores applied competency from uploaded sampling plans, reports, and survey designs.</div>
          </div>
          <div>
            <Text strong style={{ color: '#0B2641' }}>3. Confidence Levels:</Text>
            <div style={{ fontSize: 12, color: '#617487' }}>Single-source scores start as 'Low/Medium' confidence. Multi-source evidence upgrades confidence to 'High'.</div>
          </div>
        </Space>
      </Modal>
    </div>
  );
}
