/**
 * AdminDashboard — Training Intelligence overview for MoSPI / NSSTA leadership.
 */

import React, { useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Space,
  Typography,
  Alert,
  Select,
} from 'antd';
import {
  TeamOutlined,
  BarChartOutlined,
  RiseOutlined,
  BankOutlined,
  SafetyCertificateOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { MOCK_ADMIN_INTELLIGENCE } from '../data/mockData';

const { Title, Text } = Typography;

export default function AdminDashboard() {
  const intel = MOCK_ADMIN_INTELLIGENCE;
  const [selectedDepartment, setSelectedDepartment] = useState('All');

  const gapColumns = [
    {
      title: 'Competency Area',
      dataIndex: 'competency',
      key: 'competency',
      render: (t) => <Text strong style={{ color: '#0B2641' }}>{t}</Text>,
    },
    {
      title: 'Avg Gap (pts)',
      dataIndex: 'gap',
      key: 'gap',
      align: 'center',
      render: (g) => <Text style={{ color: '#BA7517', fontWeight: 700 }}>{g}</Text>,
    },
    {
      title: 'Officers Affected',
      dataIndex: 'officers',
      key: 'officers',
      align: 'center',
      render: (o) => (
        <Tag style={{ backgroundColor: '#D1E0EE', color: '#0B2641', borderColor: '#B3CDE0', borderRadius: 999 }}>
          {o} officers
        </Tag>
      ),
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#DCE7F0] bg-white p-4 shadow-sm sm:p-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <Text className="text-[11px] font-bold uppercase tracking-[0.14em] !text-[#2966A3]">
            Director workspace
          </Text>
          <Title level={3} className="!mb-1 !mt-1 !text-xl !leading-tight sm:!text-2xl" style={{ color: '#0B2641' }}>
            Training Intelligence
          </Title>
          <Text className="block max-w-2xl !text-xs !leading-5 sm:!text-sm" style={{ color: '#617487' }}>
            Org-wide competency gaps, training outcomes, and cohort demand for MoSPI / NSSTA.
          </Text>
        </div>

        <div className="flex w-full flex-col gap-1.5 sm:flex-row sm:items-center lg:w-auto">
          <Text className="!text-xs !text-[#617487] sm:whitespace-nowrap">Department cohort</Text>
          <Select
            value={selectedDepartment}
            onChange={setSelectedDepartment}
            className="w-full sm:w-[220px]"
            options={[
              { value: 'All', label: 'All Statistical Divisions' },
              { value: 'Industrial', label: 'Industrial Statistics Division' },
              { value: 'Price', label: 'Price Statistics Division' },
              { value: 'Labour', label: 'Labour Statistics Division' },
            ]}
          />
        </div>
      </div>

      <Alert
        message="MoSPI Aggregate Outcome Analytics"
        description="Aggregated view of organizational capability trends across divisions. Individual PII is anonymized in leadership reporting views."
        type="info"
        showIcon
        className="rounded-xl border-[#B3CDE0] bg-[#F0F7FF] text-[#0B2641]"
      />

      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <div className="rounded-2xl border border-[#DCE7F0] bg-white p-4 shadow-sm transition-all hover:shadow-md sm:p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#617487] mb-1">
            <TeamOutlined className="text-[#2966A3]" /> Total Tracked
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#0B2641] mt-2">
            {intel.kpis.total_officers}
          </div>
          <div className="text-xs text-[#617487] mt-1">Officers in registry</div>
        </div>

        <div className="rounded-2xl border border-[#DCE7F0] bg-white p-4 shadow-sm transition-all hover:shadow-md sm:p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#617487] mb-1">
            <BankOutlined className="text-[#3D7D70]" /> Active Learners
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#3D7D70] mt-2">
            {intel.kpis.active_learners}
          </div>
          <div className="text-xs text-[#617487] mt-1">Engaged this quarter</div>
        </div>

        <div className="rounded-2xl border border-[#DCE7F0] bg-white p-4 shadow-sm transition-all hover:shadow-md sm:p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#617487] mb-1">
            <RiseOutlined className="text-[#2966A3]" /> Avg Competency
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#0B2641] mt-2">
            {intel.kpis.avg_competency}%
          </div>
          <div className="text-xs text-[#617487] mt-1">Benchmark baseline</div>
        </div>

        <div className="rounded-2xl border border-[#DCE7F0] bg-white p-4 shadow-sm transition-all hover:shadow-md sm:p-5 border-l-4 border-l-[#3D7D70]">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#617487] mb-1">
            <SafetyCertificateOutlined className="text-[#3D7D70]" /> Avg Improvement
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#3D7D70] mt-2">
            +{intel.kpis.avg_improvement} pts
          </div>
          <div className="text-xs text-[#3D7D70] font-medium mt-1">Positive learning outcome</div>
        </div>
      </div>

      {/* Demand Insights Alert */}
      <Alert
        message={<span className="font-semibold text-[#0B2641]">Training Demand & Curricular Recommendation</span>}
        description={<span className="text-[#465C70]">{intel.demand_insights}</span>}
        type="warning"
        icon={<BulbOutlined className="text-[#BA7517]" />}
        showIcon
        className="rounded-2xl border border-[#F5D485] bg-[#FEF9EE] p-4"
      />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title={
            <Space>
              <BarChartOutlined style={{ color: '#2966A3' }} />
              <span style={{ color: '#0B2641', fontWeight: 600 }}>Pre vs Post Competency Improvement</span>
            </Space>
          }
          bordered={false}
          className="rounded-2xl border border-[#DCE7F0] bg-white shadow-sm"
        >
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={intel.pre_post_improvement}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="competency" tick={{ fontSize: 10, fill: '#617487' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#617487' }} />
                <Tooltip
                  contentStyle={{ background: '#fff', borderRadius: 8, border: '1px solid #DCE7F0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                />
                <Legend />
                <Bar dataKey="pre" fill="#94A3B8" name="Pre-Training Score" radius={[4, 4, 0, 0]} />
                <Bar dataKey="post" fill="#2966A3" name="Post-Training Score" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card
          title={
            <Space>
              <RiseOutlined style={{ color: '#2966A3' }} />
              <span style={{ color: '#0B2641', fontWeight: 600 }}>Top Competency Gaps (Org-Wide)</span>
            </Space>
          }
          bordered={false}
          className="rounded-2xl border border-[#DCE7F0] bg-white shadow-sm"
        >
          <Table
            dataSource={intel.top_gaps}
            columns={gapColumns}
            pagination={false}
            rowKey="competency"
            scroll={{ x: 450 }}
          />
        </Card>
      </div>
    </div>
  );
}
