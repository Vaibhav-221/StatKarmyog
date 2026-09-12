import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Typography, Tag, Button, Space, Skeleton, Empty } from 'antd';
import { FileTextOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getOfficerArtifacts } from '../api/client';

const { Title, Text, Paragraph } = Typography;

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
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#0C447C' }}>Work Artifacts</Title>
          <Text type="secondary">Assigned role outputs linked to your competency gaps and learning path.</Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={load}>Refresh</Button>
      </div>

      {loading ? (
        <Card bordered={false} style={{ borderRadius: 10 }}>
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      ) : artifacts.length === 0 ? (
        <Card bordered={false} style={{ borderRadius: 10 }}>
          <Empty description="No work artifacts assigned to this officer" />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {artifacts.map((artifact) => (
            <Col xs={24} md={12} xl={8} key={artifact.artifact_id}>
              <Card
                bordered={false}
                style={{ borderRadius: 10, height: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                title={<Space><FileTextOutlined style={{ color: '#0C447C' }} /><span>{artifact.artifact_id}</span></Space>}
                extra={<Tag color={difficultyColor(artifact.difficulty)}>{artifact.difficulty}</Tag>}
              >
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <div>
                    <Title level={5} style={{ color: '#0C447C', margin: 0 }}>{artifact.title}</Title>
                    <Paragraph style={{ margin: '8px 0 0', color: '#64748B', fontSize: 13 }} ellipsis={{ rows: 2 }}>
                      {artifact.description}
                    </Paragraph>
                  </div>

                  <div>
                    <Text type="secondary" style={{ fontSize: 11 }}>TYPE</Text>
                    <div><Text strong>{artifact.artifact_type}</Text></div>
                  </div>

                  <Row gutter={12}>
                    <Col span={12}>
                      <Text type="secondary" style={{ fontSize: 11 }}>DOMAIN</Text>
                      <div><Text>{artifact.domain}</Text></div>
                    </Col>
                    <Col span={12}>
                      <Text type="secondary" style={{ fontSize: 11 }}>STATUS</Text>
                      <div><Tag color="blue">{artifact.assignment_status || artifact.status}</Tag></div>
                    </Col>
                  </Row>

                  <div>
                    <Text type="secondary" style={{ fontSize: 11 }}>REQUIRED COMPETENCIES</Text>
                    <div style={{ marginTop: 6 }}>
                      {(artifact.required_competencies || []).slice(0, 5).map((name) => (
                        <Tag key={name} style={{ marginBottom: 6 }}>{name}</Tag>
                      ))}
                    </div>
                  </div>

                  <Button
                    type="primary"
                    icon={<EyeOutlined />}
                    onClick={() => navigate(`/artifacts/${artifact.artifact_id}`)}
                    style={{ background: '#0C447C', width: '100%' }}
                  >
                    View Artifact
                  </Button>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
