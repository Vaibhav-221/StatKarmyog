/**
 * Gap Analysis page — AI Competency Gap Breakdown & Root Cause Diagnostic.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Typography, Tag, Progress, Button, Empty, Skeleton } from 'antd';
import {
  WarningOutlined,
  BulbOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getGapAnalysis, getCompetencyScores } from '../api/client';

const { Text } = Typography;

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
    <div className="w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0B2641] m-0">
          AI Competency Gap Analysis
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-[#617487]">
          Granular diagnostic comparing required role expectations against multi-source evidence scores.
        </p>
      </div>

      {/* KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[#BAE6FD] bg-[#F0F7FF] p-5 shadow-sm">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-[#2966A3]">
            TOTAL TRACKED COMPETENCIES
          </span>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-[#0B2641]">
            {rows.length} Areas
          </div>
        </div>

        <div className="rounded-2xl border border-[#FDE68A] bg-[#FFFBEB] p-5 shadow-sm">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-[#92400E]">
            HIGHEST GAP IDENTIFIED
          </span>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-[#D97706]">
            {highestGap ? `${highestGap.gap} Points` : 'No gap'}
          </div>
          <p className="mt-1 text-xs text-[#92400E] truncate">
            {highestGap?.competency || 'All tracked competencies are at target'}
          </p>
        </div>

        <div className="rounded-2xl border border-[#BBF7D0] bg-[#F0FDF4] p-5 shadow-sm">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-[#166534]">
            COMPETENCIES NEAR TARGET
          </span>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-[#3D7D70]">
            {nearTargetCount} Areas
          </div>
          <p className="mt-1 text-xs text-[#166534]">Within 10 points of expected level</p>
        </div>
      </div>

      {/* Diagnostics Header */}
      <div className="flex items-center gap-2">
        <h3 className="text-base font-bold text-[#0B2641] m-0">
          Competency Diagnostics &amp; Evidence Breakdown
        </h3>
      </div>

      {/* Diagnostic Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="rounded-2xl border border-[#DCE7F0] bg-white p-6 shadow-sm">
            <Skeleton active paragraph={{ rows: 8 }} />
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-[#DCE7F0] bg-white p-6 shadow-sm">
            <Empty description="No competency gaps found for this officer" />
          </div>
        ) : rows.map((item) => (
          <div
            key={item.key}
            className={`rounded-2xl border bg-white p-5 sm:p-6 shadow-sm transition-all hover:shadow-md border-l-4 ${
              item.gap > 20
                ? 'border-l-[#DC2626] border-[#DCE7F0]'
                : item.gap > 10
                ? 'border-l-[#D97706] border-[#DCE7F0]'
                : 'border-l-[#3D7D70] border-[#DCE7F0]'
            }`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left: Name + scores + progress */}
              <div className="lg:col-span-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h4 className="text-base font-bold text-[#0B2641] m-0 truncate">{item.competency}</h4>
                  <Tag
                    color={item.status === 'High Gap' ? 'error' : item.status === 'Moderate Gap' ? 'warning' : 'success'}
                    className="!m-0 !font-semibold"
                  >
                    {item.status}
                  </Tag>
                </div>

                <div className="flex gap-4 mb-3">
                  <div>
                    <span className="block text-[10px] font-bold text-[#617487] uppercase">REQUIRED</span>
                    <span className="text-base font-bold text-[#172B3D]">{item.required}%</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-[#617487] uppercase">CURRENT</span>
                    <span className="text-base font-bold text-[#2966A3]">{item.current}%</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-[#617487] uppercase">GAP</span>
                    <span className={`text-base font-bold ${item.gap > 15 ? 'text-[#DC2626]' : 'text-[#D97706]'}`}>
                      -{item.gap}%
                    </span>
                  </div>
                </div>

                <Progress
                  percent={item.current}
                  strokeColor={item.gap > 20 ? '#DC2626' : item.gap > 10 ? '#D97706' : '#3D7D70'}
                  showInfo={false}
                />
              </div>

              {/* Middle: Why this gap */}
              <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l lg:border-r border-[#DCE7F0] pt-4 lg:pt-0 lg:px-6">
                <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase text-[#0B2641]">
                  <BulbOutlined className="text-[#D97706]" /> Why This Gap?
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs mb-2">
                  <div className="bg-[#F8FBFD] p-2.5 rounded-lg border border-[#DCE7F0]">
                    <span className="block text-[#617487] text-[11px]">Knowledge Test:</span>
                    <span className="font-bold text-[#172B3D]">
                      {item.knowledge === null ? 'Not assessed' : `${item.knowledge}%`}
                    </span>
                  </div>
                  <div className="bg-[#F8FBFD] p-2.5 rounded-lg border border-[#DCE7F0]">
                    <span className="block text-[#617487] text-[11px]">Work Artifact:</span>
                    <span className="font-bold text-[#172B3D]">
                      {item.artifact === null ? 'No evidence' : `${item.artifact}%`}
                    </span>
                  </div>
                </div>
                <div className="text-[11px] text-[#617487] flex items-center gap-1.5">
                  <span>Confidence Level:</span>
                  <Tag color="blue" className="!m-0 !text-[10px] !font-semibold">{item.confidence}</Tag>
                </div>
              </div>

              {/* Right: Recommended action */}
              <div className="lg:col-span-3 text-center flex flex-col justify-between">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-[#617487] mb-1">
                    RECOMMENDED ACTION
                  </span>
                  <p className="text-xs font-bold text-[#0B2641] m-0 mb-3 line-clamp-2">
                    Targeted learning in {item.competency}
                  </p>
                </div>
                <Button
                  type="primary"
                  icon={<RocketOutlined />}
                  onClick={() => navigate('/learning')}
                  className="!h-10 !w-full !rounded-xl !bg-[#2966A3] !text-xs !font-semibold hover:!bg-[#0B2641]"
                >
                  View Recommended Learning
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
