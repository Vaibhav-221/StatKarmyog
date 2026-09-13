/**
 * Progress Page — Gap Reduction & Overall Learning Activity Analytics.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Card, Typography, Space, Skeleton, Empty } from 'antd';
import { RiseOutlined, ArrowDownOutlined, TrophyOutlined } from '@ant-design/icons';
import { LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { getGapAnalysis, getPassportSummary } from '../api/client';

const { Text } = Typography;

const PROGRESS_BAR_COLORS = ['#2966A3', '#E76F51', '#2A9D8F', '#E9C46A', '#7C5CFC', '#E85D9E'];

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
    <div className="w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0B2641] m-0">
          Progress &amp; Gap Reduction Analytics
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-[#617487]">
          Track overall competency accumulation, milestone velocity, and gap reduction trajectory.
        </p>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="rounded-2xl border border-[#DCE7F0] bg-white p-6 shadow-sm">
          <Skeleton active paragraph={{ rows: 8 }} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {/* KPI 1 */}
            <div className="rounded-2xl border border-[#DCE7F0] bg-white p-5 shadow-sm transition-all hover:shadow-md">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#617487] mb-1">
                Initial Competency Gap
              </div>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-2xl sm:text-3xl font-bold text-[#BA7517]">{data.initial_gap}</span>
                <span className="text-xs text-[#617487] font-medium">pts</span>
              </div>
              <div className="text-xs text-[#617487] mt-2">Baseline diagnostic gap</div>
            </div>

            {/* KPI 2 */}
            <div className="rounded-2xl border border-[#DCE7F0] bg-white p-5 shadow-sm transition-all hover:shadow-md">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#617487] mb-1">
                Current Competency Gap
              </div>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-2xl sm:text-3xl font-bold text-[#2966A3]">{data.current_gap}</span>
                <span className="text-xs text-[#617487] font-medium">pts</span>
              </div>
              <div className="text-xs text-[#617487] mt-2">Active diagnostic gap remaining</div>
            </div>

            {/* KPI 3 */}
            <div className="rounded-2xl border border-[#DCE7F0] bg-white p-5 shadow-sm transition-all hover:shadow-md">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#617487] mb-1">
                Total Gap Reduction
              </div>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-2xl sm:text-3xl font-bold text-[#3D7D70]">
                  {data.gap_reduction > 0 ? `-${data.gap_reduction}` : data.gap_reduction}
                </span>
                <span className="text-xs text-[#617487] font-medium">pts</span>
              </div>
              <div className="text-xs text-[#3D7D70] font-medium mt-2 flex items-center gap-1">
                <ArrowDownOutlined /> Measurable capability gained
              </div>
            </div>
          </div>

          {/* Charts */}
          {data.overall_trend.length === 0 ? (
            <Card bordered={false} className="rounded-2xl border border-[#DCE7F0] bg-white shadow-sm">
              <Empty description="No assessment history found for this officer" />
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card
                title={
                  <Space>
                    <RiseOutlined style={{ color: '#2966A3' }} />
                    <span style={{ color: '#0B2641', fontWeight: 600 }}>Competency Growth Trend</span>
                  </Space>
                }
                bordered={false}
                className="rounded-2xl border border-[#DCE7F0] bg-white shadow-sm"
              >
                <div style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.overall_trend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="label" stroke="#617487" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} stroke="#617487" tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ background: '#fff', borderRadius: 8, border: '1px solid #DCE7F0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#2966A3"
                        strokeWidth={3}
                        name="Competency Score %"
                        dot={{ r: 4, fill: '#0B2641' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card
                title={
                  <Space>
                    <TrophyOutlined style={{ color: '#E76F51' }} />
                    <span style={{ color: '#0B2641', fontWeight: 600 }}>Gap Reduction Trajectory</span>
                  </Space>
                }
                bordered={false}
                className="rounded-2xl border border-[#DCE7F0] bg-white shadow-sm"
              >
                <div style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.overall_trend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="label" stroke="#617487" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#617487" tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ background: '#fff', borderRadius: 8, border: '1px solid #DCE7F0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                      />
                      <Bar dataKey="gap" name="Remaining Gap (pts)" radius={[6, 6, 0, 0]}>
                        {data.overall_trend.map((entry, index) => (
                          <Cell
                            key={`progress-bar-${entry.label}-${index}`}
                            fill={PROGRESS_BAR_COLORS[index % PROGRESS_BAR_COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
