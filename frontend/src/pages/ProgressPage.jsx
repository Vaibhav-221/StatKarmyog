/**
 * Progress Page — Gap Reduction & Overall Learning Activity Analytics.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, Typography, Statistic, Skeleton, Empty } from 'antd';
import { RiseOutlined, ArrowDownOutlined, TrophyOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { getGapAnalysis, getPassportSummary } from '../api/client';

const { Title, Text } = Typography;

export default function ProgressPage() {
  const { user } = useAuth();
  const officerId = user?.officer_id || 'OFF001';
  const [loading, setLoading] = useState(true);
  const [gaps, setGaps] = useState([]);
  const [passport, setPassport] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [gapRes, passportRes] = await Promise.all([
        getGapAnalysis(officerId),
        getPassportSummary(officerId),
      ]);
      setGaps(gapRes.data?.gaps || []);
      setPassport(passportRes.data);
      setLoading(false);
    }
    load();
  }, [officerId]);

  const data = useMemo(() => {
    const competencies = passport?.competencies || [];
    const currentGap = Math.round(gaps.reduce((sum, gap) => sum + (gap.gap_size || 0), 0) * 20);
    const initialGap = Math.round(
      competencies.reduce((sum, comp) => sum + Math.max(0, (comp.first_score || 0) - (comp.latest_score || 0)), 0) * 20
    );
    const trend = competencies.flatMap((comp) =>
      (comp.history || []).map((point) => ({
        label: `${comp.skill_label} ${point.recorded_on}`,
        score: Math.round(point.combined_score * 20),
        gap: currentGap,
      }))
    );

    return {
      initial_gap: initialGap || currentGap,
      current_gap: currentGap,
      gap_reduction: Math.max(0, (initialGap || currentGap) - currentGap),
      overall_trend: trend,
    };
  }, [gaps, passport]);

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
      {loading ? (
        <Card bordered={false} style={{ borderRadius: 10 }}>
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      ) : (
      <>
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
      {data.overall_trend.length === 0 ? (
        <Card bordered={false} style={{ borderRadius: 10 }}>
          <Empty description="No assessment history found for this officer" />
        </Card>
      ) : (
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
      )}
      </>
      )}
    </div>
  );
}
