/**
 * QuizPage — placeholder for Phase 4's Quiz Generator route.
 *
 * Renders a simple styled card at /quiz so the route exists
 * and the sidebar nav item works.
 */

import { Card, Typography, Space } from 'antd';
import { FormOutlined, ExperimentOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function QuizPage() {
  return (
    <div className="dashboard-container">
      <Card
        className="dashboard-card"
        style={{ textAlign: 'center', padding: '60px 24px' }}
      >
        <Space direction="vertical" size={16} align="center">
          <ExperimentOutlined
            style={{ fontSize: 48, color: '#0C447C', opacity: 0.6 }}
          />
          <Title level={3} style={{ margin: 0, color: '#1A2332' }}>
            AI Quiz Generator
          </Title>
          <Text type="secondary" style={{ fontSize: 14, maxWidth: 400, display: 'block' }}>
            Upload learning content and generate competency-tagged MCQs
            powered by AI. Submit answers to update your evidence-based
            skill scores.
          </Text>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#FDF0E0',
              color: '#BA7517',
              borderRadius: 20,
              padding: '6px 16px',
              fontSize: 12,
              fontWeight: 600,
              marginTop: 8,
            }}
          >
            <FormOutlined />
            Full UI coming in Phase 6
          </div>
        </Space>
      </Card>
    </div>
  );
}
