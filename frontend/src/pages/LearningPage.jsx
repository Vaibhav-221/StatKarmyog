/**
 * Learning Page — Recommended learning modules targeted to competency gaps.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Typography, Tag, Button, Progress, Alert, Empty, Skeleton } from 'antd';
import { BookOutlined, RocketOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getGapAnalysis, getRecommendations, getEnrollments, getCourses } from '../api/client';

const { Text } = Typography;

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
    <div className="w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0B2641] m-0">
          Recommended Learning
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-[#617487]">
          Personalized training modules targeted directly to your highest identified competency gaps.
        </p>
      </div>

      {/* Info Alert */}
      <Alert
        message="Gap-Driven Learning Curriculum"
        description="Courses are dynamically ranked based on your required vs. current competency gap size (60% Quiz / 40% Work Artifact weighted formula)."
        type="info"
        showIcon
        className="!rounded-xl"
      />

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full rounded-2xl border border-[#DCE7F0] bg-white p-6 shadow-sm">
            <Skeleton active paragraph={{ rows: 8 }} />
          </div>
        ) : rows.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-[#DCE7F0] bg-white p-6 shadow-sm">
            <Empty description="No learning recommendations found for this officer" />
          </div>
        ) : rows.map((course) => (
          <div
            key={course.course_id}
            className="rounded-2xl border border-[#DCE7F0] bg-white p-5 shadow-sm flex flex-col justify-between transition-all hover:shadow-md hover:border-[#2966A3]/30"
          >
            <div>
              {/* Provider + Gap Badge */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-white bg-[#0B2641] px-2.5 py-0.5 rounded-md">
                  {course.provider}
                </span>
                <span className="text-xs font-semibold text-[#D97706] bg-[#FFFBEB] border border-[#FDE68A] px-2.5 py-0.5 rounded-md">
                  {course.gap === null ? 'Ranked' : `Gap: ${course.gap} pts`}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-base font-bold text-[#0B2641] line-clamp-2 mt-2 mb-2">
                {course.course_title}
              </h3>

              {/* Meta */}
              <div className="flex items-center gap-2 text-xs text-[#617487] mb-3">
                <span className="flex items-center gap-1 font-medium truncate max-w-[180px]">
                  <BookOutlined className="text-[#2966A3]" /> {course.competency}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <ClockCircleOutlined /> {course.duration}
                </span>
              </div>

              {/* Reason */}
              <p className="bg-[#F8FBFD] p-3 rounded-xl border border-[#DCE7F0] text-xs text-[#172B3D] leading-relaxed mb-4">
                &quot;{course.reason}&quot;
              </p>

              {/* Progress */}
              {course.progress > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs font-medium text-[#617487] mb-1">
                    <span>Progress</span>
                    <span className="font-bold text-[#2966A3]">{course.progress}%</span>
                  </div>
                  <Progress percent={course.progress} strokeColor="#2966A3" showInfo={false} size="small" />
                </div>
              )}
            </div>

            {/* CTA */}
            <Button
              type="primary"
              icon={<RocketOutlined />}
              onClick={() => navigate('/igot')}
              className="!h-10 !w-full !rounded-xl !bg-[#2966A3] !text-xs !font-semibold hover:!bg-[#0B2641] mt-2"
            >
              {course.progress > 0 ? 'Continue Learning' : 'Start Learning Module'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
