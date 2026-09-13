import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, Typography, Tag, Button, Space, Progress, Skeleton, Empty } from 'antd';
import { ArrowLeftOutlined, ThunderboltOutlined, RocketOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getArtifactDetail,
  getOfficerArtifactGaps,
  getOfficerArtifactRecommendations,
} from '../api/client';

const { Title, Text, Paragraph } = Typography;

function gapColor(status) {
  if (status === 'Critical Gap') return 'red';
  if (status === 'High Gap') return 'volcano';
  if (status === 'Moderate Gap') return 'orange';
  return 'green';
}

export default function WorkArtifactDetail() {
  const { artifactId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const officerId = user?.officer_id || 'OFF001';
  const [loading, setLoading] = useState(true);
  const [artifact, setArtifact] = useState(null);
  const [gaps, setGaps] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [artifactRes, gapRes, recRes] = await Promise.all([
        getArtifactDetail(artifactId),
        getOfficerArtifactGaps(officerId, artifactId),
        getOfficerArtifactRecommendations(officerId, artifactId),
      ]);
      setArtifact(artifactRes.data);
      setGaps(gapRes.data || []);
      setRecommendations(recRes.data || []);
      setLoading(false);
    }
    load();
  }, [artifactId, officerId]);

  const recommendationByCid = useMemo(() => {
    const grouped = {};
    recommendations.forEach((rec) => {
      if (!grouped[rec.cid]) grouped[rec.cid] = rec;
    });
    return grouped;
  }, [recommendations]);

  const startQuiz = (gap) => {
    const params = new URLSearchParams({
      competency: gap.competency,
      artifact_id: gap.artifact_id,
    });
    navigate(`/quiz?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  if (!artifact) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <Card bordered={false} className="rounded-2xl border border-[#DCE7F0] bg-white shadow-sm">
          <Empty description="Artifact not found" />
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/artifacts')}
        className="!h-10 !rounded-xl !border-[#DCE7F0] !text-xs !font-semibold text-[#0B2641] hover:!border-[#2966A3]"
      >
        Back to Work Artifacts
      </Button>

      {/* Artifact Metadata Card */}
      <div className="rounded-2xl border border-[#DCE7F0] bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 justify-between">
          <div className="lg:col-span-8">
            <span className="text-xs font-bold text-[#2966A3] bg-[#D1E0EE]/50 px-2.5 py-0.5 rounded-md mb-2 inline-block">
              {artifact.artifact_id}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0B2641] m-0 mb-2">
              {artifact.title}
            </h2>
            <p className="text-xs sm:text-sm text-[#617487] leading-relaxed mb-4">
              {artifact.description}
            </p>
            <div className="flex flex-wrap gap-2">
              <Tag color="blue" className="!font-semibold !rounded-md">{artifact.artifact_type}</Tag>
              <Tag color="gold" className="!font-semibold !rounded-md">{artifact.domain}</Tag>
              <Tag color="purple" className="!font-semibold !rounded-md">{artifact.difficulty}</Tag>
              <Tag color="green" className="!font-semibold !rounded-md">{artifact.status}</Tag>
            </div>
          </div>
          <div className="lg:col-span-4 bg-[#F8FBFD] p-4 rounded-xl border border-[#DCE7F0] space-y-2.5 text-xs">
            <div>
              <span className="block text-[#617487] text-[10px] font-bold uppercase">Department</span>
              <span className="font-bold text-[#172B3D]">{artifact.department}</span>
            </div>
            <div>
              <span className="block text-[#617487] text-[10px] font-bold uppercase">Target Role</span>
              <span className="font-bold text-[#172B3D]">{artifact.role}</span>
            </div>
            <div>
              <span className="block text-[#617487] text-[10px] font-bold uppercase mb-1">Required Skills</span>
              <div className="flex flex-wrap gap-1">
                {(artifact.skills || []).map((skill) => (
                  <span key={skill} className="bg-white border border-[#DCE7F0] px-2 py-0.5 rounded text-[11px] font-medium text-[#0B2641]">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <h3 className="text-base font-bold text-[#0B2641] mb-2">
        Required Competencies & Gap Diagnostic
      </h3>

      <div className="space-y-4">
        {gaps.map((gap) => {
          const rec = recommendationByCid[gap.cid];
          return (
            <div
              key={`${gap.artifact_id}-${gap.cid}-${gap.display_competency}`}
              className={`rounded-2xl border bg-white p-5 sm:p-6 shadow-sm transition-all hover:shadow-md border-l-4 ${
                gap.gap > 40 ? 'border-l-[#DC2626] border-[#DCE7F0]' : gap.gap > 25 ? 'border-l-[#EA580C] border-[#DCE7F0]' : gap.gap > 10 ? 'border-l-[#D97706] border-[#DCE7F0]' : 'border-l-[#3D7D70] border-[#DCE7F0]'
              }`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-4">
                  <h4 className="text-base font-bold text-[#0B2641] m-0">
                    {gap.display_competency}
                  </h4>
                  <p className="mt-1 text-xs text-[#617487] m-0">
                    Mapped to {gap.competency}
                  </p>
                  <Tag color={gapColor(gap.gap_status)} className="!mt-2.5 !font-semibold">
                    {gap.gap_status}
                  </Tag>
                </div>

                <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l lg:border-r border-[#DCE7F0] pt-4 lg:pt-0 lg:px-6">
                  <div className="grid grid-cols-3 gap-2 text-center mb-2">
                    <div>
                      <span className="block text-[10px] font-bold text-[#617487] uppercase">REQUIRED</span>
                      <span className="font-bold text-sm text-[#172B3D]">{gap.required_percent}%</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-[#617487] uppercase">CURRENT</span>
                      <span className="font-bold text-sm text-[#2966A3]">{gap.current_percent}%</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-[#617487] uppercase">GAP</span>
                      <span className={`font-bold text-sm ${gap.gap > 25 ? 'text-[#DC2626]' : 'text-[#D97706]'}`}>
                        {gap.gap}%
                      </span>
                    </div>
                  </div>
                  <Progress percent={gap.current_percent} strokeColor="#2966A3" showInfo={false} />
                </div>

                <div className="lg:col-span-4 flex flex-col justify-between">
                  {rec ? (
                    <div className="bg-[#F8FBFD] rounded-xl p-3 border border-[#DCE7F0] mb-3">
                      <p className="text-xs font-bold text-[#0B2641] m-0 mb-1 flex items-center gap-1.5">
                        <RocketOutlined className="text-[#2966A3]" /> {rec.course_title}
                      </p>
                      <p className="text-[11px] text-[#617487] line-clamp-2 m-0 mb-2">
                        {rec.reason}
                      </p>
                      <Button
                        type="link"
                        size="small"
                        onClick={() => navigate('/learning')}
                        className="!p-0 !text-xs !font-semibold !text-[#2966A3]"
                      >
                        View Recommended Learning &rarr;
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-[#617487] mb-3">No matching course found in catalogue.</p>
                  )}
                  <Button
                    type="primary"
                    icon={<ThunderboltOutlined />}
                    onClick={() => startQuiz(gap)}
                    className="!h-10 !w-full !rounded-xl !bg-[#2966A3] !text-xs !font-semibold hover:!bg-[#0B2641]"
                  >
                    Generate AI Quiz for Artifact
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
