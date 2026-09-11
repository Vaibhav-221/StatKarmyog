/**
 * Dashboard — Officer's primary landing page.
 *
 * Five sections:
 *   A. Profile header (hero band)
 *   B. Skill radar chart (Recharts RadarChart)
 *   C. Competency gap table (AntD Table)
 *   D. Recommended courses (scrollable cards)
 *   E. Enrollment progress (Progress bars)
 *
 * Fetches data on mount via the API client (falls back to mock).
 * Shows Skeleton loaders per section during load, and a non-intrusive
 * Alert banner when the backend isn't reachable (mock data still renders).
 */

import { useEffect, useState, useMemo } from 'react';
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
  Skeleton,
  Alert,
  Button,
  notification,
} from 'antd';
import {
  UserOutlined,
  DashboardOutlined,
  BookOutlined,
  RiseOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SafetyCertificateOutlined,
  ReloadOutlined,
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
  LineChart,
  Line,
  XAxis,
  YAxis,
} from 'recharts';

import { useAuth } from '../context/AuthContext';
import {
  getOfficerProfile,
  getGapAnalysis,
  getRecommendations,
  getEnrollments,
  getPassportSummary,
  triggerReassessment,
} from '../api/client';

const { Title, Text } = Typography;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Return a class name for a gap size tag. */
function gapTagClass(gapSize) {
  if (gapSize >= 2) return 'gap-tag-positive';
  if (gapSize > 0) return 'gap-tag-warning';
  return 'gap-tag-ok';
}

/** Return human label for gap. */
function gapLabel(gapSize) {
  if (gapSize >= 2) return `−${gapSize} Critical`;
  if (gapSize > 0) return `−${gapSize} Gap`;
  return 'On Track';
}

/** Enrollment status color and icon. */
function enrollmentMeta(status) {
  switch (status) {
    case 'Completed':
      return { color: '#3B6D11', strokeColor: '#3B6D11', icon: <CheckCircleOutlined />, tagColor: 'green' };
    case 'In-Progress':
      return { color: '#0C447C', strokeColor: '#0C447C', icon: <ClockCircleOutlined />, tagColor: 'blue' };
    default:
      return { color: '#BA7517', strokeColor: '#BA7517', icon: <ExclamationCircleOutlined />, tagColor: 'orange' };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function Dashboard() {
  const { user } = useAuth();
  const officerId = user?.officer_id || 'OFF001';

  // ── State ──────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState(null);
  const [gaps, setGaps] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [enrollments, setEnrollments] = useState(null);
  const [passport, setPassport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);
  const [reassessingCid, setReassessingCid] = useState(null);

  // ── Fetch on mount ─────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      setLoading(true);
      const [profRes, gapRes, recRes, enrRes, passRes] = await Promise.all([
        getOfficerProfile(officerId),
        getGapAnalysis(officerId),
        getRecommendations(officerId),
        getEnrollments(officerId),
        getPassportSummary(officerId),
      ]);

      if (cancelled) return;

      setProfile(profRes.data);
      setGaps(gapRes.data);
      setRecommendations(recRes.data);
      setEnrollments(enrRes.data);
      setPassport(passRes.data);
      setUsingMock(profRes.isMock || gapRes.isMock || passRes.isMock);
      setLoading(false);
    }

    fetchAll();
    return () => { cancelled = true; };
  }, [officerId]);

  // ── Re-assessment Trigger Handler ──────────────────────────────────────
  const handleRetakeAssessment = async (comp) => {
    setReassessingCid(comp.cid);
    try {
      const res = await triggerReassessment(officerId, comp.cid);
      notification.info({
        message: `Re-Assessment Triggered: ${comp.skill_label}`,
        description: res.data?.message || 'Re-assessment ready.',
        placement: 'topRight',
      });
    } catch {
      notification.error({
        message: 'Re-assessment trigger failed',
        description: 'Could not connect to backend endpoint.',
      });
    } finally {
      setReassessingCid(null);
    }
  };

  // ── Derived data for radar ─────────────────────────────────────────────
  const radarData = useMemo(() => {
    if (!gaps?.gaps) return [];
    return gaps.gaps.map((g) => ({
      skill: g.skill.length > 16 ? g.skill.slice(0, 14) + '…' : g.skill,
      fullSkill: g.skill,
      Current: g.current_level,
      Required: g.expected_level,
    }));
  }, [gaps]);

  // ── Gap table columns ─────────────────────────────────────────────────
  const gapColumns = [
    {
      title: 'Skill',
      dataIndex: 'skill',
      key: 'skill',
      render: (text) => <Text strong style={{ fontSize: 13 }}>{text}</Text>,
    },
    {
      title: 'Current',
      dataIndex: 'current_level',
      key: 'current_level',
      width: 90,
      align: 'center',
      render: (v) => <Text style={{ fontSize: 14, fontWeight: 600 }}>{v}</Text>,
    },
    {
      title: 'Required',
      dataIndex: 'expected_level',
      key: 'expected_level',
      width: 90,
      align: 'center',
      render: (v) => <Text style={{ fontSize: 14, fontWeight: 600 }}>{v}</Text>,
    },
    {
      title: 'Gap',
      dataIndex: 'gap_size',
      key: 'gap_size',
      width: 120,
      align: 'center',
      sorter: (a, b) => b.gap_size - a.gap_size,
      defaultSortOrder: 'ascend',
      render: (v) => (
        <Tag className={gapTagClass(v)} style={{ minWidth: 80, textAlign: 'center' }}>
          {gapLabel(v)}
        </Tag>
      ),
    },
  ];

  // ── Officer initials ───────────────────────────────────────────────────
  const initials = profile?.name
    ? profile.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'OK';

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="dashboard-container">
      {/* ── API warning banner ──────────────────────────────────── */}
      {usingMock && !loading && (
        <Alert
          className="api-error-alert"
          message="Backend not reachable — showing demo data"
          description="Start the FastAPI server (uvicorn app.main:app --port 8000) to see live data."
          type="info"
          showIcon
          closable
          banner
        />
      )}

      {/* ═══════════════════════════════════════════════════════════
          SECTION A — Profile Header
          ═══════════════════════════════════════════════════════════ */}
      {loading ? (
        <div className="skeleton-hero">
          <Skeleton active avatar paragraph={{ rows: 2 }} />
        </div>
      ) : (
        <div className="profile-hero">
          <Space size={20} align="start">
            <Avatar
              size={64}
              style={{
                backgroundColor: 'rgba(255,255,255,0.15)',
                border: '2px solid rgba(255,255,255,0.3)',
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              {initials}
            </Avatar>
            <div>
              <h2 className="officer-name">{profile?.name}</h2>
              <p className="officer-subtitle">{profile?.designation}</p>
              <p className="officer-subtitle">{profile?.department}</p>
              <div className="experience-badge">
                <TrophyOutlined />
                {profile?.experience_years} years of experience &middot;{' '}
                {profile?.qualification}
              </div>
            </div>
          </Space>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          SECTION B + C — Skill Radar & Gap Table (side by side)
          ═══════════════════════════════════════════════════════════ */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        {/* B — Radar Chart */}
        <Col xs={24} lg={12}>
          <Card className="dashboard-card" style={{ height: '100%' }}>
            <div className="section-title">
              <DashboardOutlined />
              Skill Competency Matrix
            </div>
            {loading ? (
              <Skeleton active paragraph={{ rows: 8 }} />
            ) : (
              <div className="radar-chart-container">
                <ResponsiveContainer width="100%" height={360}>
                  <RadarChart data={radarData} outerRadius="72%">
                    <PolarGrid stroke="#E8ECF1" />
                    <PolarAngleAxis
                      dataKey="skill"
                      tick={{ fontSize: 11, fill: '#5A6B7D' }}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 5]}
                      tick={{ fontSize: 10, fill: '#8C99A9' }}
                      tickCount={6}
                    />
                    <Tooltip
                      formatter={(value, name) => [value, name]}
                      labelFormatter={(label, payload) => {
                        const full = payload?.[0]?.payload?.fullSkill;
                        return full || label;
                      }}
                    />
                    <Radar
                      name="Required"
                      dataKey="Required"
                      stroke="#BA7517"
                      fill="#BA7517"
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                    <Radar
                      name="Current"
                      dataKey="Current"
                      stroke="#0C447C"
                      fill="#0C447C"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </Col>

        {/* C — Gap Table */}
        <Col xs={24} lg={12}>
          <Card className="dashboard-card" style={{ height: '100%' }}>
            <div className="section-title">
              <RiseOutlined />
              Competency Gap Analysis
            </div>
            {loading ? (
              <Skeleton active paragraph={{ rows: 8 }} />
            ) : (
              <Table
                dataSource={gaps?.gaps || []}
                columns={gapColumns}
                rowKey="skill"
                pagination={false}
                size="middle"
                scroll={{ y: 300 }}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* ═══════════════════════════════════════════════════════════
          SECTION D — Recommended Courses
          ═══════════════════════════════════════════════════════════ */}
      <Card
        className="dashboard-card"
        style={{ marginBottom: 24 }}
      >
        <div className="section-title">
          <BookOutlined />
          Recommended Courses
        </div>
        {loading ? (
          <Row gutter={16}>
            {[1, 2, 3].map((i) => (
              <Col key={i} xs={24} sm={12} md={8}>
                <Skeleton active paragraph={{ rows: 3 }} />
              </Col>
            ))}
          </Row>
        ) : (
          <div className="course-scroll-container">
            {(recommendations || []).map((course) => (
              <Card key={course.course_id} className="course-card" bordered={false}>
                <div className="course-card-title">{course.course_title}</div>
                <Space size={[6, 6]} wrap>
                  {(course.matched_skills || []).map((skill) => (
                    <Tag
                      key={skill}
                      className="gap-tag-warning"
                      style={{ fontSize: 11 }}
                    >
                      Closes: {skill}
                    </Tag>
                  ))}
                </Space>
                <div className="course-card-score">
                  Relevance: {Math.round((course.final_score || 0) * 100)}%
                </div>
              </Card>
            ))}
            {(recommendations || []).length === 0 && (
              <div className="empty-state">
                <BookOutlined />
                <p>No recommendations yet — complete a quiz to refine suggestions.</p>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* ═══════════════════════════════════════════════════════════
          SECTION E — Enrollment Progress
          ═══════════════════════════════════════════════════════════ */}
      <Card className="dashboard-card" style={{ marginBottom: 24 }}>
        <div className="section-title">
          <UserOutlined />
          My Enrollments
        </div>
        {loading ? (
          <Skeleton active paragraph={{ rows: 5 }} />
        ) : (
          <>
            {(enrollments || []).length === 0 ? (
              <div className="empty-state">
                <BookOutlined />
                <p>No enrollments yet.</p>
              </div>
            ) : (
              (enrollments || []).map((enr) => {
                const meta = enrollmentMeta(enr.status);
                return (
                  <div key={enr.enrollment_id} className="enrollment-item">
                    <div className="enrollment-item-header">
                      <span className="enrollment-course-title">
                        {enr.course_title}
                      </span>
                      <Tag
                        icon={meta.icon}
                        color={meta.tagColor}
                        style={{ fontWeight: 500, borderRadius: 6 }}
                      >
                        {enr.status}
                      </Tag>
                    </div>
                    <Progress
                      percent={enr.progress_percent}
                      strokeColor={meta.strokeColor}
                      trailColor="#E8ECF1"
                      size="small"
                      format={(pct) => `${pct}%`}
                    />
                  </div>
                );
              })
            )}
          </>
        )}
      </Card>

      {/* ═══════════════════════════════════════════════════════════
          SECTION F — Competency Passport & Trajectory
          ═══════════════════════════════════════════════════════════ */}
      <Card className="dashboard-card" style={{ marginBottom: 24 }}>
        <div className="section-title">
          <SafetyCertificateOutlined />
          Competency Passport &amp; Trajectory
        </div>
        {loading ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : (
          <>
            {passport?.message && (
              <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                {passport.message}
              </Text>
            )}

            <Row gutter={[16, 16]}>
              {(passport?.competencies || []).map((comp) => {
                const hasHistory = comp.history && comp.history.length > 1;

                // Improvement Badge
                let badgeTag = null;
                if (comp.improved === true) {
                  badgeTag = (
                    <Tag
                      style={{
                        background: '#eaf3de',
                        color: '#3B6D11',
                        borderColor: '#C5DFA8',
                        fontWeight: 600,
                        borderRadius: 6,
                      }}
                    >
                      Improved +{comp.delta}
                    </Tag>
                  );
                } else if (comp.improved === false) {
                  badgeTag = (
                    <Tag
                      style={{
                        background: '#fdf0e0',
                        color: '#BA7517',
                        borderColor: '#F0D6A8',
                        fontWeight: 600,
                        borderRadius: 6,
                      }}
                    >
                      Declined ({comp.delta})
                    </Tag>
                  );
                } else {
                  badgeTag = (
                    <Tag
                      style={{
                        background: '#F4F6F9',
                        color: '#5A6B7D',
                        borderColor: '#E8ECF1',
                        fontWeight: 500,
                        borderRadius: 6,
                      }}
                    >
                      No change yet
                    </Tag>
                  );
                }

                return (
                  <Col key={comp.cid} xs={24} md={12}>
                    <Card
                      bordered
                      size="small"
                      style={{
                        borderRadius: 10,
                        borderColor: '#E8ECF1',
                        height: '100%',
                        background: '#FAFCFF',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: 12,
                          gap: 8,
                          flexWrap: 'wrap',
                        }}
                      >
                        <div>
                          <Text strong style={{ fontSize: 15, color: '#1A2332', display: 'block' }}>
                            {comp.skill_label}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            CID: {comp.cid} &middot; Score: <strong>{comp.latest_score}</strong> / 5.0
                          </Text>
                        </div>
                        <Space align="center" wrap>
                          {badgeTag}
                          <Button
                            size="small"
                            type="primary"
                            ghost
                            icon={<ReloadOutlined />}
                            loading={reassessingCid === comp.cid}
                            onClick={() => handleRetakeAssessment(comp)}
                            style={{ borderRadius: 6, fontSize: 12, borderColor: '#0C447C', color: '#0C447C' }}
                          >
                            Retake Assessment
                          </Button>
                        </Space>
                      </div>

                      {hasHistory ? (
                        <div style={{ height: 120, width: '100%', marginTop: 8 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={comp.history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <XAxis dataKey="recorded_on" tick={{ fontSize: 10, fill: '#8C99A9' }} />
                              <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: '#8C99A9' }} />
                              <Tooltip
                                formatter={(v) => [v, 'Combined Score']}
                                labelFormatter={(label) => `Recorded: ${label}`}
                              />
                              <Line
                                type="monotone"
                                dataKey="combined_score"
                                stroke="#0C447C"
                                strokeWidth={2.5}
                                dot={{ r: 4, fill: '#0C447C' }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div
                          style={{
                            padding: '16px 12px',
                            background: '#F4F6F9',
                            borderRadius: 8,
                            textAlign: 'center',
                            marginTop: 8,
                          }}
                        >
                          <Text strong style={{ fontSize: 13, color: '#0C447C', display: 'block' }}>
                            Baseline Score: {comp.latest_score}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            Baseline recorded — retake to track improvement
                          </Text>
                        </div>
                      )}
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </>
        )}
      </Card>
    </div>
  );
}

