/**
 * iGOT / NSSTA Ecosystem Page — Mock learning platform integration.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Typography, Tabs, Tag, Button, Progress, Alert, Table, Empty, Skeleton } from 'antd';
import {
  BankOutlined,
  PlayCircleOutlined,
  GlobalOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { getCourses, getEnrollments, getRecommendations } from '../api/client';

const { Text } = Typography;

export default function IgotPage() {
  const { user } = useAuth();
  const officerId = user?.officer_id || 'OFF001';
  const [activeTab, setActiveTab] = useState('igot');
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [recRes, enrollRes, courseRes] = await Promise.all([
        getRecommendations(officerId),
        getEnrollments(officerId),
        getCourses(),
      ]);
      setRecommendations(recRes.data || []);
      setEnrollments(enrollRes.data || []);
      setCourses(courseRes.data || []);
      setLoading(false);
    }
    load();
  }, [officerId]);

  const learningRows = useMemo(() => {
    const enrollmentByCourse = Object.fromEntries(enrollments.map((item) => [item.course_id, item]));
    const courseById = Object.fromEntries(courses.map((item) => [item.course_id, item]));

    return recommendations.map((rec) => {
      const course = courseById[rec.course_id];
      const enrollment = enrollmentByCourse[rec.course_id];
      return {
        key: rec.course_id,
        id: rec.course_id,
        title: rec.course_title,
        competency: (rec.matched_skills || []).join(', ') || 'Officer competency gap',
        provider: course?.source || 'Catalogue',
        status: enrollment?.status || 'Recommended',
        progress: enrollment?.progress_percent || 0,
      };
    });
  }, [recommendations, enrollments, courses]);

  const igotCourses = learningRows.filter((course) => !course.provider.toLowerCase().includes('nssta'));
  const nsstaCourses = learningRows.filter((course) => course.provider.toLowerCase().includes('nssta'));

  const columns = [
    {
      title: 'Course Title',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div>
          <Text strong style={{ color: '#0B2641' }}>{text}</Text>
          <div style={{ fontSize: 11, color: '#617487' }}>ID: {record.id} • {record.competency}</div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      render: (st) => (
        <Tag
          color={st === 'Completed' ? 'success' : st === 'In-Progress' ? 'processing' : 'default'}
          className="!font-semibold"
        >
          {st}
        </Tag>
      ),
    },
    {
      title: 'Progress',
      dataIndex: 'progress',
      key: 'progress',
      render: (p) => (
        <div style={{ minWidth: 120 }}>
          <Progress percent={p} strokeColor="#2966A3" size="small" />
        </div>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          size="small"
          className="!bg-[#2966A3] !rounded-lg !text-xs !font-semibold hover:!bg-[#0B2641]"
        >
          {record.progress > 0 ? 'Continue' : 'Launch Module'}
        </Button>
      ),
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0B2641] m-0">
            Learning Ecosystem
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#617487]">
            Integration portal with iGOT Karmayogi &amp; NSSTA Training Academies.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#D1E0EE] text-[#0B2641]">
          <ApiOutlined className="text-[#2966A3]" /> iGOT-Compatible Mock API
        </span>
      </div>

      {/* Info Alert */}
      <Alert
        message="API Abstraction Layer Active"
        description="The frontend consumes an API service layer designed for the official iGOT Karmayogi OAuth2 & REST endpoints. In this prototype, mock services push enrollment progress events via webhooks."
        type="info"
        showIcon
        className="!rounded-xl"
      />

      {/* Tabs Card */}
      <div className="rounded-2xl border border-[#DCE7F0] bg-white p-5 shadow-sm">
        {loading ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : (
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'igot',
                label: (
                  <span className="font-semibold text-xs sm:text-sm">
                    <GlobalOutlined /> iGOT Karmayogi Courses
                  </span>
                ),
                children: igotCourses.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table dataSource={igotCourses} columns={columns} pagination={false} />
                  </div>
                ) : (
                  <Empty description="No iGOT resources recommended for this officer" />
                ),
              },
              {
                key: 'nssta',
                label: (
                  <span className="font-semibold text-xs sm:text-sm">
                    <BankOutlined /> NSSTA Academy Courses
                  </span>
                ),
                children: nsstaCourses.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table dataSource={nsstaCourses} columns={columns} pagination={false} />
                  </div>
                ) : (
                  <Empty description="No NSSTA resources recommended for this officer" />
                ),
              },
            ]}
          />
        )}
      </div>
    </div>
  );
}
