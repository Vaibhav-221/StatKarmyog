/**
 * Learning Page — Recommended learning modules targeted to competency gaps.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, Typography, Tag, Button, Progress, Space, Alert, Empty, Skeleton } from 'antd';
import { BookOutlined, RocketOutlined, ClockCircleOutlined, TrophyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getGapAnalysis, getRecommendations, getEnrollments, getCourses } from '../api/client';

const { Title, Text, Paragraph } = Typography;

export default function LearningPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const officerId = user?.officer_id || 'OFF001';
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [gaps, setGaps] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [recRes, gapRes, enrollRes, courseRes] = await Promise.all([
        getRecommendations(officerId),
        getGapAnalysis(officerId),
        getEnrollments(officerId),
        getCourses(),
      ]);
      setRecommendations(recRes.data || []);
      setGaps(gapRes.data?.gaps || []);
      setEnrollments(enrollRes.data || []);
      setCourses(courseRes.data || []);
      setLoading(false);
    }
    load();
  }, [officerId]);

  const rows = useMemo(() => {
    const gapBySkill = Object.fromEntries(gaps.map((gap) => [gap.skill, gap]));
    const enrollmentByCourse = Object.fromEntries(enrollments.map((item) => [item.course_id, item]));
    const courseById = Object.fromEntries(courses.map((item) => [item.course_id, item]));

    return recommendations.map((rec) => {
      const enrollment = enrollmentByCourse[rec.course_id];
      const course = courseById[rec.course_id];
      const matchedGap = (rec.matched_skills || []).map((skill) => gapBySkill[skill]).find(Boolean);
      return {
        ...rec,
        provider: course?.source || 'Catalogue',
        competency: (rec.matched_skills || []).join(', ') || 'Officer competency gap',
        gap: matchedGap ? Math.round(matchedGap.gap_size * 20) : null,
        duration: course?.duration_hours ? `${course.duration_hours} Hours` : 'Duration unavailable',
        reason: (rec.matched_skills || []).length
          ? `Recommended from this officer's gaps: ${(rec.matched_skills || []).join(', ')}.`
          : "Recommended by the backend semantic engine for this officer.",
        progress: enrollment?.progress_percent || 0,
        status: enrollment?.status || 'Not Started',
      };
    });
  }, [recommendations, gaps, enrollments, courses]);

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, color: '#0C447C' }}>
          RECOMMENDED LEARNING
        </Title>
        <Text type="secondary">
          Personalized training modules targeted directly to your highest identified competency gaps.
        </Text>
      </div>

      <Alert
        message="Gap-Driven Learning Path"
        description="Courses are dynamically ranked based on your required vs. current competency gap size (60% Quiz / 40% Work Artifact weighted)."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Row gutter={[24, 24]}>
        {loading ? (
          <Col span={24}>
            <Card bordered={false} style={{ borderRadius: 10 }}>
              <Skeleton active paragraph={{ rows: 8 }} />
            </Card>
          </Col>
        ) : rows.length === 0 ? (
          <Col span={24}>
            <Card bordered={false} style={{ borderRadius: 10 }}>
              <Empty description="No learning recommendations found for this officer" />
            </Card>
          </Col>
        ) : rows.map((course) => (
          <Col xs={24} md={12} lg={8} key={course.course_id}>
            <Card
              bordered={false}
              style={{
                borderRadius: 10,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Tag color="navy" style={{ background: '#0C447C', color: '#fff' }}>
                    {course.provider}
                  </Tag>
                  <Tag color="orange">{course.gap === null ? 'Gap: backend-ranked' : `Gap: ${course.gap} pts`}</Tag>
                </div>

                <Title level={4} style={{ color: '#0C447C', fontSize: 16, marginTop: 4, minHeight: 44 }}>
                  {course.course_title}
                </Title>

                <Space style={{ fontSize: 12, color: '#64748B', marginBottom: 12 }}>
                  <span><BookOutlined /> {course.competency}</span>
                  <span>•</span>
                  <span><ClockCircleOutlined /> {course.duration}</span>
                </Space>

                <Paragraph style={{ background: '#F8FAFC', padding: 10, borderRadius: 6, fontSize: 12, color: '#334155' }}>
                  "{course.reason}"
                </Paragraph>

                {course.progress > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                      <span>Progress</span>
                      <span>{course.progress}%</span>
                    </div>
                    <Progress percent={course.progress} strokeColor="#0C447C" showInfo={false} size="small" />
                  </div>
                )}
              </div>

              <Button
                type="primary"
                icon={<RocketOutlined />}
                onClick={() => navigate('/igot')}
                style={{ background: '#0C447C', marginTop: 16, width: '100%' }}
              >
                {course.progress > 0 ? 'Continue Learning' : 'Start Learning'}
              </Button>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
