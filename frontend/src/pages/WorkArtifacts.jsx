import React, { useEffect, useState } from 'react';
import { Tag, Button, Skeleton, Empty } from 'antd';
import { FileTextOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getOfficerArtifacts } from '../api/client';

function difficultyColor(value) {
  if (value === 'Advanced') return 'red';
  if (value === 'Intermediate') return 'gold';
  return 'green';
}

export default function WorkArtifacts() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const officerId = user?.officer_id || 'OFF001';
  const [loading, setLoading] = useState(true);
  const [artifacts, setArtifacts] = useState([]);

  async function load() {
    setLoading(true);
    const res = await getOfficerArtifacts(officerId);
    setArtifacts(res.data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [officerId]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0B2641] m-0">
            Work Artifacts
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#617487]">
            Assigned role outputs linked to your competency gaps and learning path.
          </p>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={load}
          className="!h-10 !rounded-xl !border-[#DCE7F0] !text-sm !font-semibold text-[#0B2641] hover:!border-[#2966A3]"
        >
          Refresh
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="rounded-2xl border border-[#DCE7F0] bg-white p-6 shadow-sm">
          <Skeleton active paragraph={{ rows: 8 }} />
        </div>
      ) : artifacts.length === 0 ? (
        <div className="rounded-2xl border border-[#DCE7F0] bg-white p-6 shadow-sm">
          <Empty description="No work artifacts assigned to this officer" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {artifacts.map((artifact) => (
            <div
              key={artifact.artifact_id}
              className="rounded-2xl border border-[#DCE7F0] bg-white p-5 shadow-sm flex flex-col justify-between transition-all hover:shadow-md hover:border-[#2966A3]/30"
            >
              <div>
                {/* Card Header */}
                <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-[#F1F6FA]">
                  <div className="flex items-center gap-2">
                    <FileTextOutlined className="text-[#2966A3] text-base" />
                    <span className="font-bold text-xs text-[#0B2641] bg-[#D1E0EE]/50 px-2 py-0.5 rounded">
                      {artifact.artifact_id}
                    </span>
                  </div>
                  <Tag color={difficultyColor(artifact.difficulty)} className="!m-0 !font-semibold !text-[11px]">
                    {artifact.difficulty}
                  </Tag>
                </div>

                {/* Title & Description */}
                <h3 className="text-base font-bold text-[#0B2641] m-0 line-clamp-1 mb-1.5">
                  {artifact.title}
                </h3>
                <p className="text-xs text-[#617487] line-clamp-2 leading-relaxed mb-4">
                  {artifact.description}
                </p>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs mb-4 bg-[#F8FBFD] p-3 rounded-xl border border-[#DCE7F0]">
                  <div>
                    <span className="block text-[10px] font-bold text-[#617487] uppercase">TYPE</span>
                    <span className="font-semibold text-[#172B3D] truncate block">{artifact.artifact_type}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-[#617487] uppercase">DOMAIN</span>
                    <span className="font-semibold text-[#172B3D] truncate block">{artifact.domain}</span>
                  </div>
                </div>

                {/* Required Competencies */}
                <div className="mb-4">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-[#617487] mb-1.5">
                    REQUIRED COMPETENCIES
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(artifact.required_competencies || []).slice(0, 4).map((name) => (
                      <span
                        key={name}
                        className="text-[11px] bg-white border border-[#DCE7F0] text-[#0B2641] px-2 py-0.5 rounded-md font-medium"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Button
                type="primary"
                icon={<EyeOutlined />}
                onClick={() => navigate(`/artifacts/${artifact.artifact_id}`)}
                className="!h-10 !w-full !rounded-xl !bg-[#2966A3] !text-xs !font-semibold hover:!bg-[#0B2641] mt-2"
              >
                View Artifact
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
