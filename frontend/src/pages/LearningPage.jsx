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
    <div className="w-full max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-6 lg:px-8 space-y-5 sm:space-y-6">
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
        message={<span className="text-sm font-semibold text-[#0B2641] sm:text-base">Gap-Driven Learning Curriculum</span>}
        description={<span className="text-xs leading-5 text-[#617487] sm:text-sm">Courses are ranked from your required versus current competency gap using the 60% Quiz / 40% Work Artifact evidence model.</span>}
        type="info"
        showIcon
        className="!mb-2 !rounded-xl !border-[#B8D4EA] !bg-[#F0F7FF] !px-3 !py-3 sm:!mb-4 sm:!px-4"
      />

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="col-span-full rounded-2xl border border-[#DCE7F0] bg-white p-4 shadow-sm sm:p-6">
            <Skeleton active paragraph={{ rows: 8 }} />
          </div>
        ) : rows.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-[#DCE7F0] bg-white p-4 shadow-sm sm:p-6">
            <Empty description="No learning recommendations found for this officer" />
          </div>
        ) : rows.map((course) => (
          <div
            key={course.course_id}
            className="flex min-w-0 flex-col justify-between rounded-2xl border border-[#DCE7F0] bg-white p-4 shadow-sm transition-all hover:border-[#2966A3]/30 hover:shadow-md sm:p-5"
          >
            <div>
              {/* Provider + Gap Badge */}
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-md bg-[#0B2641] px-2.5 py-1 text-[10px] font-bold text-white sm:text-xs">
                  {course.provider}
                </span>
                <span className="rounded-md border border-[#F5D485] bg-[#FEF9EE] px-2.5 py-1 text-[10px] font-semibold text-[#BA7517] sm:text-xs">
                  {course.gap === null ? 'Ranked' : `Gap: ${course.gap} pts`}
                </span>
              </div>

              {/* Title */}
              <h3 className="mb-2 mt-2 line-clamp-2 text-base font-bold leading-6 text-[#0B2641]">
                {course.course_title}
              </h3>

              {/* Meta */}
              <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#617487]">
                <span className="flex min-w-0 max-w-full items-center gap-1 font-medium">
                  <BookOutlined className="text-[#2966A3]" /> {course.competency}
                </span>
                <span className="flex items-center gap-1">
                  <ClockCircleOutlined /> {course.duration}
                </span>
              </div>

              {/* Reason */}
              <p className="mb-4 rounded-xl border border-[#DCE7F0] bg-[#F8FBFD] p-3 text-xs leading-relaxed text-[#172B3D]">
                &quot;{course.reason}&quot;
              </p>

              {/* Progress */}
              {course.progress > 0 && (
                <div className="mb-4 rounded-lg border border-[#E7F1F8] bg-[#F8FBFD] p-2.5">
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
