/**
 * Competency Passport Page — Signature feature proving before/after competency improvement.
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  Row,
  Col,
  Card,
  Typography,
  Tag,
  Space,
  Alert,
  Empty,
  Skeleton,
} from "antd";
import {
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  RiseOutlined,
} from "@ant-design/icons";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import {
  getCompetencyScores,
  getGapAnalysis,
  getOfficerProfile,
  getPassportSummary,
} from "../api/client";

const { Title, Text } = Typography;

export default function CompetencyPassportPage() {
  const { user } = useAuth();
  const officerId = user?.officer_id || "OFF001";
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [passport, setPassport] = useState(null);
  const [gaps, setGaps] = useState([]);
  const [scores, setScores] = useState([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
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
      } finally {
        setLoading(false);
      }
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
      const hasQuiz = relatedScores.some(
        (score) => score.quiz_score !== null && score.quiz_score !== undefined,
      );
      const hasArtifact = relatedScores.some(
        (score) =>
          score.artifact_score !== null && score.artifact_score !== undefined,
      );
      const requiredScore = gapBySkill[comp.skill_label]?.expected_level;

      return {
        ...comp,
        chart_history: (comp.history || []).map((point) => ({
          label: point.recorded_on,
          score: Math.round(point.combined_score * 20),
          expected: point.expected_level !== undefined
            ? Math.round(point.expected_level * 20)
            : requiredScore !== undefined ? Math.round(requiredScore * 20) : null,
        })),
        current_score: Math.round(comp.latest_score * 20),
        previous_score: Math.round(comp.first_score * 20),
        required_score:
          requiredScore !== undefined ? Math.round(requiredScore * 20) : null,
        improvement: Math.round(comp.delta * 20),
        confidence:
          comp.history?.[comp.history.length - 1]?.confidence_level ||
          "Not available",
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
      <div className="w-full max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  const firstCard = [...cards].sort((left, right) => right.chart_history.length - left.chart_history.length)[0];

  return (
    <div className="w-full max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-6 lg:px-8 space-y-5 sm:space-y-6">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Title level={3} className="!text-xl sm:!text-2xl" style={{ margin: 0, color: "#0B2641" }}>
              COMPETENCY PASSPORT
            </Title>
            <Text type="secondary">
              Verified, immutable record of competency scores, evidence sources,
              and trajectory progression.
            </Text>
          </div>

          <Tag
            color="blue"
            className="!m-0 !max-w-full !whitespace-normal !rounded-lg"
            style={{ background: "#0B2641", color: "#fff", fontSize: 13, padding: "4px 14px" }}
          >
            Officer Passport: {profile?.name || user?.name || officerId} (
            {profile?.designation || profile?.role_id || "Officer"})
          </Tag>
        </div>

        <Alert
          message={<span className="text-sm font-semibold text-[#0B2641] sm:text-base">Improvement Loop</span>}
          description={<span className="text-xs leading-5 text-[#617487] sm:text-sm">Baseline -&gt; Learning -&gt; Re-assessment -&gt; Improvement. Each checkpoint is recorded without overwriting earlier evidence.</span>}
          type="info"
          showIcon
          className="!mb-0 !rounded-xl !border-[#B8D4EA] !bg-[#F0F7FF] !px-3 !py-2.5 sm:!px-4"
        />

        <Card
          title={
            <Space>
              <RiseOutlined style={{ color: "#2966A3" }} />
              <span style={{ color: "#0B2641", fontWeight: 600 }}>
                Competency Growth Trajectory
              </span>
            </Space>
          }
          bordered={false}
          style={{ boxShadow: "0 2px 8px rgba(11,38,65,0.05)" }}
          className="!mt-3 !overflow-hidden rounded-2xl border border-[#DCE7F0] bg-white shadow-sm sm:!mt-4"
        >
          {firstCard ? (
            <div className="mx-auto flex h-[220px] w-full max-w-5xl justify-center sm:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={firstCard.chart_history} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#E2E8F0"
                  />
                  <XAxis
                    dataKey="label"
                    stroke="#617487"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    stroke="#617487"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#fff",
                      borderRadius: 8,
                      border: "1px solid #DCE7F0",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    }}
                    formatter={(val) => [
                      `${val}%`,
                      `${firstCard.skill_label} Score`,
                    ]}
                  />
                  <Line
                    type="linear"
                    dataKey="score"
                    stroke="#2966A3"
                    strokeWidth={3}
                    dot={{ r: 5, fill: "#0B2641" }}
                    activeDot={{ r: 7, fill: "#3D7D70" }}
                  />
                  <Line
                    type="linear"
                    dataKey="expected"
                    stroke="#E9C46A"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    name="Required Level %"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Empty description="No competency passport history found for this officer" />
          )}
        </Card>

        <div className="flex items-center justify-between gap-3">
          <Title level={4} className="!mb-0 !text-base sm:!text-lg" style={{ color: "#0B2641" }}>
            Verified Passport Competency Stamp Cards
          </Title>
          <span className="shrink-0 rounded-full bg-[#E7F1F8] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#2966A3]">
            {cards.length} tracked
          </span>
        </div>

        <Row gutter={[16, 16]}>
          {cards.length === 0 ? (
            <Col span={24}>
              <Card bordered={false} className="!rounded-xl !border !border-[#DCE7F0]">
                <Empty description="No competency passport history found for this officer" />
              </Card>
            </Col>
          ) : (
            cards.map((comp) => (
              <Col xs={24} md={12} lg={8} key={comp.cid}>
                <Card
                  bordered={false}
                  style={{
                    borderRadius: 12,
                    boxShadow: "0 4px 14px rgba(11,38,65,0.05)",
                    border: "1px solid #DCE7F0",
                    background: "#F8FBFD",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: -10,
                      right: -10,
                      opacity: 0.08,
                      fontSize: 100,
                      color: "#2966A3",
                      pointerEvents: "none",
                    }}
                  >
                    <SafetyCertificateOutlined />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 12,
                      gap: 8,
                    }}
                  >
                      <Text strong style={{ fontSize: 16, color: "#0B2641" }}>
                      {comp.skill_label}
                    </Text>
                    <Tag color="blue">{comp.confidence} Confidence</Tag>
                  </div>

                  <Row
                    gutter={12}
                    style={{
                      background: "#fff",
                      padding: 12,
                      borderRadius: 8,
                      border: "1px solid #DCE7F0",
                      marginBottom: 16,
                    }}
                  >
                    <Col span={6} style={{ textAlign: "center" }}>
                      <Text type="secondary" style={{ fontSize: 10 }}>
                        PREVIOUS
                      </Text>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: "#64748B",
                        }}
                      >
                        {comp.previous_score}%
                      </div>
                    </Col>
                    <Col span={6} style={{ textAlign: "center" }}>
                      <Text type="secondary" style={{ fontSize: 10 }}>
                        CURRENT
                      </Text>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: "#0B2641",
                        }}
                      >
                        {comp.current_score}%
                      </div>
                    </Col>
                    <Col span={6} style={{ textAlign: "center" }}>
                      <Text type="secondary" style={{ fontSize: 10 }}>
                        REQUIRED
                      </Text>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: "#334155",
                        }}
                      >
                        {comp.required_score === null
                          ? "N/A"
                          : `${comp.required_score}%`}
                      </div>
                    </Col>
                    <Col span={6} style={{ textAlign: "center" }}>
                      <Text type="secondary" style={{ fontSize: 10 }}>
                        GAIN
                      </Text>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: comp.improvement >= 0 ? "#3D7D70" : "#C2413B",
                        }}
                      >
                        {comp.improvement > 0
                          ? `+${comp.improvement}`
                          : comp.improvement}
                      </div>
                    </Col>
                  </Row>

                  <Text
                    strong
                    style={{
                      fontSize: 12,
                      color: "#475569",
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    VERIFIED EVIDENCE CHECKMARKS:
                  </Text>

                  <Space
                    direction="vertical"
                    style={{ width: "100%", fontSize: 12 }}
                    size={6}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        color: comp.evidence_checkmarks.knowledge_assessment
                          ? "#3D7D70"
                          : "#94A3B8",
                      }}
                    >
                      <CheckCircleOutlined /> Knowledge Assessment
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        color: comp.evidence_checkmarks.work_artifact
                          ? "#3D7D70"
                          : "#94A3B8",
                      }}
                    >
                      <CheckCircleOutlined /> Work Artifact Evidence
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        color: comp.evidence_checkmarks.ai_quiz
                          ? "#3D7D70"
                          : "#94A3B8",
                      }}
                    >
                      <CheckCircleOutlined /> AI Quiz Assessment
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        color: comp.evidence_checkmarks.reassessment
                          ? "#3D7D70"
                          : "#94A3B8",
                      }}
                    >
                      <CheckCircleOutlined /> Re-assessment Verified
                    </div>
                  </Space>
                </Card>
              </Col>
            ))
          )}
        </Row>
      </div>
  );
}
