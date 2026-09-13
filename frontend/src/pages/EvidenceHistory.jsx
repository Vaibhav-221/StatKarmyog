/**
 * Evidence History page — Audit log of all uploaded work artifacts.
 */

import React, { useEffect, useState } from 'react';
import { Table, Typography, Tag, Button, Modal, Descriptions, Space, Empty, Skeleton } from 'antd';
import { FileTextOutlined, EyeOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { getWorkEvidence } from '../api/client';

const { Text } = Typography;

export default function EvidenceHistory() {
  const { user } = useAuth();
  const officerId = user?.officer_id || 'OFF001';
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evidence, setEvidence] = useState([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await getWorkEvidence(officerId);
      setEvidence(res.data || []);
      setLoading(false);
    }
    load();
  }, [officerId]);

  const columns = [
    {
      title: 'Document Name',
      dataIndex: 'document_name',
      key: 'document_name',
      render: (text) => (
        <Space>
          <FileTextOutlined style={{ color: '#2966A3' }} />
          <Text strong style={{ color: '#0B2641' }}>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Upload Date',
      dataIndex: 'recorded_on',
      key: 'recorded_on',
      align: 'center',
    },
    {
      title: 'Detected Competencies',
      dataIndex: 'competencies_detected',
      key: 'competencies_detected',
      render: (comps) => (
        <Space wrap>
          {comps.map((c, i) => (
            <Tag key={i} color="blue">{c}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Confidence',
      dataIndex: 'confidence_level',
      key: 'confidence_level',
      align: 'center',
      render: (conf) => (
        <Tag color={(conf || '').toLowerCase().includes('medium') ? 'orange' : 'green'}>{conf}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'source',
      key: 'status',
      align: 'center',
      render: () => (
        <Tag icon={<CheckCircleOutlined />} color="success">Analyzed</Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => setSelectedArtifact(record)}
          className="!p-0 !text-xs !font-semibold !text-[#2966A3]"
        >
          View Evidence
        </Button>
      ),
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0B2641] m-0">
          Work Evidence History
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-[#617487]">
          Audit history of all uploaded work artifacts and extracted competency evidence.
        </p>
      </div>

      {/* Table Card */}
      <div className="rounded-2xl border border-[#DCE7F0] bg-white p-5 shadow-sm">
        {loading ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : evidence.length > 0 ? (
          <div className="overflow-x-auto">
            <Table dataSource={evidence} columns={columns} pagination={false} rowKey="id" />
          </div>
        ) : (
          <Empty description="No work evidence found for this officer" />
        )}
      </div>

      {/* Artifact Details Modal */}
      <Modal
        title={
          <span className="font-bold text-[#0B2641]">
            {selectedArtifact?.document_name || 'Artifact Details'}
          </span>
        }
        open={!!selectedArtifact}
        onCancel={() => setSelectedArtifact(null)}
        footer={[
          <Button key="close" type="primary" onClick={() => setSelectedArtifact(null)} className="!bg-[#2966A3] !rounded-xl">
            Close
          </Button>,
        ]}
      >
        {selectedArtifact && (
          <div className="space-y-4 pt-2">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Recorded On">{selectedArtifact.recorded_on}</Descriptions.Item>
              <Descriptions.Item label="Analysis Status">
                <Tag color="success">Analyzed</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Evidence Confidence">
                <Tag color="blue">{selectedArtifact.confidence_level}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Artifact Reference">{selectedArtifact.artifact_reference}</Descriptions.Item>
            </Descriptions>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B2641] mb-2">
                Extracted Competency Scores:
              </h4>
              <div className="space-y-1.5">
                {Object.entries(selectedArtifact.scores || {}).map(([comp, score], idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center py-1.5 px-3 bg-[#F8FBFD] rounded-lg border border-[#DCE7F0] text-xs"
                  >
                    <span className="font-semibold text-[#172B3D]">{comp}</span>
                    <span className="font-bold text-[#2966A3]">{score}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B2641] mb-1.5">
                Evidence Summary:
              </h4>
              <p className="bg-[#F8FBFD] p-3 rounded-xl border border-[#DCE7F0] text-xs text-[#172B3D] leading-relaxed m-0">
                &quot;{selectedArtifact.summary}&quot;
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
