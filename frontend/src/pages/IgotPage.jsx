/**
 * iGOT / NSSTA Ecosystem Page — Mock learning platform integration.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Card, Typography, Tabs, Tag, Button, Progress, Alert, Table, Empty, Skeleton } from 'antd';
import {
  BankOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  GlobalOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { getCourses, getEnrollments, getRecommendations } from '../api/client';

const { Title, Text, Paragraph } = Typography;

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
          <Text strong style={{ color: '#0C447C' }}>{text}</Text>
          <div style={{ fontSize: 11, color: '#64748B' }}>ID: {record.id} • {record.competency}</div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      render: (st) => (
        <Tag color={st === 'Completed' ? 'success' : st === 'In-Progress' ? 'processing' : 'default'}>
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
          <Progress percent={p} strokeColor="#0C447C" size="small" />
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
          style={{ background: '#0C447C' }}
        >
          {record.progress > 0 ? 'Continue' : 'Launch'}
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header with Prototype Integration Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#0C447C' }}>
            LEARNING ECOSYSTEM
          </Title>
          <Text type="secondary">
            Integration portal with iGOT Karmayogi & NSSTA Training Academies.
          </Text>
        </div>

        <Tag icon={<ApiOutlined />} color="cyan" style={{ fontSize: 12, padding: '4px 12px', borderRadius: 12 }}>
          Prototype Integration / iGOT-Compatible Mock API
        </Tag>
      </div>

      <Alert
        message="API Abstraction Layer Active"
        description="The frontend consumes an API service layer designed for the official iGOT Karmayogi OAuth2 & REST endpoints. In this prototype, mock services push enrollment progress events via webhooks."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
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
                <span>
                  <GlobalOutlined /> iGOT Karmayogi Courses
                </span>
              ),
              children: igotCourses.length > 0 ? <Table dataSource={igotCourses} columns={columns} pagination={false} /> : <Empty description="No iGOT resources recommended for this officer" />,
            },
            {
              key: 'nssta',
              label: (
                <span>
                  <BankOutlined /> NSSTA Academy Courses
                </span>
              ),
              children: nsstaCourses.length > 0 ? <Table dataSource={nsstaCourses} columns={columns} pagination={false} /> : <Empty description="No NSSTA resources recommended for this officer" />,
            },
          ]}
          />
        )}
      </Card>
    </div>
  );
}
