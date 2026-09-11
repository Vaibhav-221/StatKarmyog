/**
 * Evidence History page — Audit log of all uploaded work artifacts.
 */

import React, { useEffect, useState } from 'react';
import { Card, Table, Typography, Tag, Button, Modal, Descriptions, Space, Empty, Skeleton } from 'antd';
import { FileTextOutlined, EyeOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { getWorkEvidence } from '../api/client';

const { Title, Text, Paragraph } = Typography;

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
          <FileTextOutlined style={{ color: '#0C447C' }} />
          <Text strong style={{ color: '#0C447C' }}>
            {text}
          </Text>
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
            <Tag key={i} color="blue">
              {c}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Confidence',
      dataIndex: 'confidence_level',
      key: 'confidence_level',
      align: 'center',
      render: (conf) => <Tag color={(conf || '').toLowerCase().includes('medium') ? 'orange' : 'green'}>{conf}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'source',
      key: 'status',
      align: 'center',
      render: () => (
        <Tag icon={<CheckCircleOutlined />} color="success">
          Analyzed
        </Tag>
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
          style={{ color: '#0C447C' }}
        >
          View Evidence
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, color: '#0C447C' }}>
          Work Evidence History
        </Title>
        <Text type="secondary">
          Audit history of all uploaded work artifacts and extracted competency evidence.
        </Text>
      </div>

      <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        {loading ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : evidence.length > 0 ? (
          <Table dataSource={evidence} columns={columns} pagination={false} rowKey="id" />
        ) : (
          <Empty description="No work evidence found for this officer" />
        )}
      </Card>

      {/* Artifact Details Modal */}
      <Modal
        title={selectedArtifact?.document_name || 'Artifact Details'}
        open={!!selectedArtifact}
        onCancel={() => setSelectedArtifact(null)}
        footer={[
          <Button key="close" type="primary" onClick={() => setSelectedArtifact(null)} style={{ background: '#0C447C' }}>
            Close
          </Button>,
        ]}
      >
        {selectedArtifact && (
          <div>
            <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Recorded On">{selectedArtifact.recorded_on}</Descriptions.Item>
              <Descriptions.Item label="Analysis Status">Analyzed</Descriptions.Item>
              <Descriptions.Item label="Evidence Confidence">{selectedArtifact.confidence_level}</Descriptions.Item>
              <Descriptions.Item label="Artifact Reference">{selectedArtifact.artifact_reference}</Descriptions.Item>
            </Descriptions>

            <Title level={5} style={{ color: '#0C447C' }}>Extracted Competency Scores:</Title>
            <div style={{ marginBottom: 16 }}>
              {Object.entries(selectedArtifact.scores || {}).map(([comp, score], idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                  <Text strong>{comp}</Text>
                  <Text style={{ color: '#0C447C', fontWeight: 600 }}>{score}%</Text>
                </div>
              ))}
            </div>

            <Title level={5} style={{ color: '#0C447C' }}>Evidence Summary:</Title>
            <Paragraph style={{ background: '#F8FAFC', padding: 12, borderRadius: 6, fontSize: 13 }}>
              "{selectedArtifact.summary}"
            </Paragraph>
          </div>
        )}
      </Modal>
    </div>
  );
}
