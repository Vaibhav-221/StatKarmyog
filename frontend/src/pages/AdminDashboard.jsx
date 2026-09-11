/**
 * AdminDashboard — MoSPI / training-team analytics overview.
 *
 * Four sections:
 *   A. Headline Statistics (Statistic cards)
 *   B. Org-Wide Gap Distribution (Recharts BarChart)
 *   C. Training Effectiveness (AntD Table)
 *   D. Department Breakdown (AntD Table + BarChart)
 *
 * Phase 6: runs on mock data from src/api/adminMockData.js.
 * Phase 6B will swap mock calls with real API fetch — no component changes needed.
 */

import { useEffect, useState, useMemo } from 'react';
import {
  Row,
  Col,
  Card,
  Table,
  Tag,
  Statistic,
  Space,
  Typography,
  Skeleton,
  Alert,
} from 'antd';
import {
  TeamOutlined,
  BarChartOutlined,
  RiseOutlined,
  BankOutlined,
  WarningOutlined,
  SafetyCertificateOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  MinusOutlined,
} from '@ant-design/icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';

import {
  getGapSummary,
  getTrainingEffectiveness,
  getDepartmentSummary,
} from '../api/client';

const { Title, Text } = Typography;

// ── Disclosure note — shows under each relevant section ─────────────────────
const DISCLOSURE_NOTE =
  'Scores combine quiz and work-artifact evidence where available (60%/40% weighted). See individual officer profiles for confidence levels.';

function DisclosureNote() {
  return (
    <Text
      type="secondary"
      style={{
        fontSize: 11,
        display: 'block',
        marginTop: 16,
        lineHeight: 1.5,
        color: '#8C99A9',
      }}
    >
      {DISCLOSURE_NOTE}
    </Text>
  );
}

// ── Custom bar chart tooltip ─────────────────────────────────────────────────
function GapBarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #E8ECF1',
        borderRadius: 8,
        padding: '10px 14px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        fontSize: 12,
      }}
    >
      <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>
        {d?.skill_label || label}
      </Text>
      <div>Avg Gap: <strong>{d?.avg_gap?.toFixed(1)}</strong></div>
      <div>Avg Current: {d?.avg_current_level?.toFixed(1)} / Required: {d?.avg_required_level?.toFixed(1)}</div>
      <div>Officers Below Required: <strong>{d?.officers_below_required}</strong> / {d?.officer_count}</div>
    </div>
  );
}

// ── Department chart tooltip ─────────────────────────────────────────────────
function DeptBarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #E8ECF1',
        borderRadius: 8,
        padding: '10px 14px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        fontSize: 12,
      }}
    >
      <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>
        {d?.department || label}
      </Text>
      <div>Officers: <strong>{d?.officer_count}</strong></div>
      <div>Avg Gap: <strong>{d?.avg_gap_across_all_skills?.toFixed(1)}</strong></div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function AdminDashboard() {
  // ── State ──────────────────────────────────────────────────────────────
  const [gapSummary, setGapSummary] = useState(null);
  const [training, setTraining] = useState(null);
  const [trainingMessage, setTrainingMessage] = useState(null);
  const [departments, setDepartments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);

  // ── Fetch on mount ─────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      setLoading(true);
      const [gapRes, trainRes, deptRes] = await Promise.all([
        getGapSummary(),
        getTrainingEffectiveness(),
        getDepartmentSummary(),
      ]);

      if (cancelled) return;

      setGapSummary(gapRes.data);
      setTraining(trainRes.data);
      setTrainingMessage(trainRes.message || null);
      setDepartments(deptRes.data);
      setUsingMock(gapRes.isMock || trainRes.isMock || deptRes.isMock);
      setLoading(false);
    }

    fetchAll();
    return () => { cancelled = true; };
  }, []);


  // ── Derived headline statistics ────────────────────────────────────────
  const stats = useMemo(() => {
    if (!gapSummary) return null;
    const totalOfficers = Math.max(...gapSummary.map((g) => g.officer_count));
    const avgGap =
      gapSummary.reduce((s, g) => s + g.avg_gap, 0) / gapSummary.length;
    const belowRequired = gapSummary.reduce(
      (s, g) => s + g.officers_below_required,
      0
    );
    // Unique officers below required (approx — capped at totalOfficers)
    const uniqueBelow = Math.min(
      belowRequired,
      totalOfficers
    );
    return {
      totalOfficers,
      avgGap: avgGap.toFixed(1),
      officersBelow: uniqueBelow,
      competenciesTracked: gapSummary.length,
    };
  }, [gapSummary]);

  // ── Gap data for bar chart (sorted desc by avg_gap) ────────────────────
  const sortedGaps = useMemo(() => {
    if (!gapSummary) return [];
    return [...gapSummary]
      .sort((a, b) => b.avg_gap - a.avg_gap)
      .map((g) => ({
        ...g,
        // Truncate label for chart axis
        short_label:
          g.skill_label.length > 18
            ? g.skill_label.slice(0, 16) + '…'
            : g.skill_label,
      }));
  }, [gapSummary]);

  // ── Department data sorted desc ────────────────────────────────────────
  const sortedDepts = useMemo(() => {
    if (!departments) return [];
    return [...departments].sort(
      (a, b) => b.avg_gap_across_all_skills - a.avg_gap_across_all_skills
    );
  }, [departments]);

  // ── Training Effectiveness table columns ───────────────────────────────
  const trainingColumns = [
    {
      title: 'Competency',
      dataIndex: 'skill_label',
      key: 'skill_label',
      render: (text) => <Text strong style={{ fontSize: 13 }}>{text}</Text>,
    },
    {
      title: 'Re-assessed',
      dataIndex: 'officers_reassessed',
      key: 'officers_reassessed',
      width: 110,
      align: 'center',
      sorter: (a, b) => a.officers_reassessed - b.officers_reassessed,
      render: (v) => <Text style={{ fontWeight: 600 }}>{v}</Text>,
    },
    {
      title: 'Avg Improvement',
      dataIndex: 'avg_improvement',
      key: 'avg_improvement',
      width: 140,
      align: 'center',
      sorter: (a, b) => a.avg_improvement - b.avg_improvement,
      render: (v) => (
        <Text
          style={{
            fontWeight: 600,
            color: v > 0 ? '#3B6D11' : v < 0 ? '#C0392B' : '#5A6B7D',
          }}
        >
          {v > 0 ? '+' : ''}{v.toFixed(1)}
        </Text>
      ),
    },
    {
      title: 'Improved',
      dataIndex: 'improved_count',
      key: 'improved_count',
      width: 100,
      align: 'center',
      render: (v) => (
        <Tag
          icon={<ArrowUpOutlined />}
          style={{
            background: '#eaf3de',
            color: '#3B6D11',
            border: '1px solid #C5DFA8',
            fontWeight: 600,
            borderRadius: 6,
            minWidth: 50,
            textAlign: 'center',
          }}
        >
          {v}
        </Tag>
      ),
    },
    {
      title: 'Declined',
      dataIndex: 'declined_count',
      key: 'declined_count',
      width: 100,
      align: 'center',
      render: (v) => (
        <Tag
          icon={<ArrowDownOutlined />}
          style={{
            background: v > 0 ? '#fdecea' : '#F4F6F9',
            color: v > 0 ? '#C0392B' : '#5A6B7D',
            border: `1px solid ${v > 0 ? '#F5C6C0' : '#E8ECF1'}`,
            fontWeight: 600,
            borderRadius: 6,
            minWidth: 50,
            textAlign: 'center',
          }}
        >
          {v}
        </Tag>
      ),
    },
    {
      title: 'No Change',
      dataIndex: 'no_change_count',
      key: 'no_change_count',
      width: 100,
      align: 'center',
      render: (v) => (
        <Tag
          icon={<MinusOutlined />}
          style={{
            background: '#F4F6F9',
            color: '#5A6B7D',
            border: '1px solid #E8ECF1',
            fontWeight: 500,
            borderRadius: 6,
            minWidth: 50,
            textAlign: 'center',
          }}
        >
          {v}
        </Tag>
      ),
    },
  ];

  // ── Department table columns ───────────────────────────────────────────
  const deptColumns = [
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (text) => <Text strong style={{ fontSize: 13 }}>{text}</Text>,
    },
    {
      title: 'Officers',
      dataIndex: 'officer_count',
      key: 'officer_count',
      width: 100,
      align: 'center',
      sorter: (a, b) => a.officer_count - b.officer_count,
      render: (v) => <Text style={{ fontWeight: 600 }}>{v}</Text>,
    },
    {
      title: 'Avg Gap',
      dataIndex: 'avg_gap_across_all_skills',
      key: 'avg_gap_across_all_skills',
      width: 120,
      align: 'center',
      sorter: (a, b) =>
        a.avg_gap_across_all_skills - b.avg_gap_across_all_skills,
      defaultSortOrder: 'descend',
      render: (v) => {
        let color = '#3B6D11';
        let bg = '#eaf3de';
        let border = '#C5DFA8';
        if (v >= 1.0) {
          color = '#C0392B';
          bg = '#fdecea';
          border = '#F5C6C0';
        } else if (v >= 0.5) {
          color = '#BA7517';
          bg = '#fdf0e0';
          border = '#F0D6A8';
        }
        return (
          <Tag
            style={{
              background: bg,
              color,
              border: `1px solid ${border}`,
              fontWeight: 600,
              borderRadius: 6,
              minWidth: 55,
              textAlign: 'center',
            }}
          >
            {v.toFixed(1)}
          </Tag>
        );
      },
    },
  ];

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="dashboard-container">
      {/* ── Mock data notice ───────────────────────────────────────── */}
      {usingMock && !loading && (
        <Alert
          className="api-error-alert"
          message="Running on demo data — backend endpoints not connected"
          description="Phase 6B will wire these views to real API endpoints. Response shapes are pre-matched."
          type="info"
          showIcon
          closable
          banner
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════
          Admin page header
          ═══════════════════════════════════════════════════════════════ */}
      <div className="admin-hero">
        <Space size={16} align="center">
          <SafetyCertificateOutlined style={{ fontSize: 28, opacity: 0.9 }} />
          <div>
            <h2 className="admin-hero-title">Organisation Analytics</h2>
            <p className="admin-hero-subtitle">
              MoSPI / NSSTA — Competency Gap & Training Effectiveness Overview
            </p>
          </div>
        </Space>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION A — Headline Statistics
          ═══════════════════════════════════════════════════════════════ */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <Col key={i} xs={12} sm={12} md={6}>
              <Card className="dashboard-card">
                <Skeleton active paragraph={{ rows: 1 }} />
              </Card>
            </Col>
          ))
        ) : (
          <>
            <Col xs={12} sm={12} md={6}>
              <Card className="dashboard-card stat-card">
                <Statistic
                  title={
                    <span className="stat-title">
                      <TeamOutlined /> Total Officers
                    </span>
                  }
                  value={stats?.totalOfficers}
                  valueStyle={{ color: '#0C447C', fontWeight: 700, fontSize: 28 }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Card className="dashboard-card stat-card">
                <Statistic
                  title={
                    <span className="stat-title">
                      <BarChartOutlined /> Avg Org-Wide Gap
                    </span>
                  }
                  value={stats?.avgGap}
                  suffix="/ 5.0"
                  valueStyle={{
                    color: parseFloat(stats?.avgGap) >= 1.0 ? '#BA7517' : '#3B6D11',
                    fontWeight: 700,
                    fontSize: 28,
                  }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Card className="dashboard-card stat-card">
                <Statistic
                  title={
                    <span className="stat-title">
                      <WarningOutlined /> Below Required Level
                    </span>
                  }
                  value={stats?.officersBelow}
                  suffix={`officer-skill gaps`}
                  valueStyle={{ color: '#C0392B', fontWeight: 700, fontSize: 28 }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Card className="dashboard-card stat-card">
                <Statistic
                  title={
                    <span className="stat-title">
                      <SafetyCertificateOutlined /> Competencies Tracked
                    </span>
                  }
                  value={stats?.competenciesTracked}
                  valueStyle={{ color: '#0C447C', fontWeight: 700, fontSize: 28 }}
                />
              </Card>
            </Col>
          </>
        )}
      </Row>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION B — Org-Wide Gap Distribution (BarChart)
          ═══════════════════════════════════════════════════════════════ */}
      <Card className="dashboard-card" style={{ marginBottom: 24 }}>
        <div className="section-title">
          <BarChartOutlined />
          Org-Wide Competency Gap Distribution
        </div>
        {loading ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : (
          <>
            <div style={{ width: '100%', height: 380 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sortedGaps}
                  margin={{ top: 10, right: 20, left: 0, bottom: 60 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#E8ECF1"
                  />
                  <XAxis
                    dataKey="short_label"
                    tick={{ fontSize: 11, fill: '#5A6B7D' }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                    height={80}
                  />
                  <YAxis
                    domain={[0, 3]}
                    tick={{ fontSize: 11, fill: '#8C99A9' }}
                    label={{
                      value: 'Avg Gap',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fontSize: 12, fill: '#8C99A9' },
                    }}
                  />
                  <Tooltip content={<GapBarTooltip />} />
                  <Bar
                    dataKey="avg_gap"
                    name="Avg Gap"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  >
                    {sortedGaps.map((entry, idx) => (
                      <Cell
                        key={`gap-bar-${idx}`}
                        fill={entry.avg_gap >= 1.0 ? '#BA7517' : '#0C447C'}
                        fillOpacity={0.85}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <DisclosureNote />
          </>
        )}
      </Card>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION C + D — Training Effectiveness & Department Breakdown
          ═══════════════════════════════════════════════════════════════ */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        {/* C — Training Effectiveness Table */}
        <Col xs={24} lg={14}>
          <Card className="dashboard-card" style={{ height: '100%' }}>
            <div className="section-title">
              <RiseOutlined />
              Training Effectiveness
            </div>
            {loading ? (
              <Skeleton active paragraph={{ rows: 8 }} />
            ) : (
              <>
                {trainingMessage && (!training || training.length === 0) && (
                  <Alert
                    message="No Re-assessment Data Yet"
                    description={trainingMessage}
                    type="info"
                    showIcon
                    style={{ marginBottom: 16, borderRadius: 8 }}
                  />
                )}
                <Table
                  dataSource={training || []}
                  columns={trainingColumns}
                  rowKey="cid"
                  pagination={false}
                  size="middle"
                  scroll={{ x: 680 }}
                />
                <DisclosureNote />
              </>
            )}
          </Card>
        </Col>

        {/* D — Department Breakdown */}
        <Col xs={24} lg={10}>
          <Card className="dashboard-card" style={{ height: '100%' }}>
            <div className="section-title">
              <BankOutlined />
              Department Breakdown
            </div>
            {loading ? (
              <Skeleton active paragraph={{ rows: 8 }} />
            ) : (
              <>
                {/* Mini bar chart */}
                <div style={{ width: '100%', height: 220, marginBottom: 16 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={sortedDepts}
                      layout="vertical"
                      margin={{ top: 4, right: 20, left: 10, bottom: 4 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                        stroke="#E8ECF1"
                      />
                      <XAxis
                        type="number"
                        domain={[0, 2]}
                        tick={{ fontSize: 10, fill: '#8C99A9' }}
                      />
                      <YAxis
                        dataKey="department"
                        type="category"
                        width={140}
                        tick={{ fontSize: 11, fill: '#5A6B7D' }}
                        tickFormatter={(v) =>
                          v.length > 20 ? v.slice(0, 18) + '…' : v
                        }
                      />
                      <Tooltip content={<DeptBarTooltip />} />
                      <Bar
                        dataKey="avg_gap_across_all_skills"
                        name="Avg Gap"
                        radius={[0, 6, 6, 0]}
                        maxBarSize={22}
                      >
                        {sortedDepts.map((entry, idx) => (
                          <Cell
                            key={`dept-bar-${idx}`}
                            fill={
                              entry.avg_gap_across_all_skills >= 1.0
                                ? '#BA7517'
                                : entry.avg_gap_across_all_skills >= 0.5
                                ? '#0C447C'
                                : '#3B6D11'
                            }
                            fillOpacity={0.8}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Department table */}
                <Table
                  dataSource={sortedDepts}
                  columns={deptColumns}
                  rowKey="department"
                  pagination={false}
                  size="small"
                />
                <DisclosureNote />
              </>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
