/**
 * Work Evidence Upload page — Upload work artifacts for AI competency extraction.
 */

import React, { useState } from 'react';
import { Row, Col, Card, Typography, Upload, Button, Steps, Tag, Progress, Alert, Space, message } from 'antd';
import {
  InboxOutlined,
  FilePdfOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { uploadArtifact } from '../api/client';
import { useAuth } from '../context/AuthContext';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

export default function WorkEvidenceUpload() {
  const { user } = useAuth();
  const officerId = user?.officer_id || 'OFF001';
  const [fileList, setFileList] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);

  const handleUploadChange = ({ fileList: newFileList }) => {
    setFileList(newFileList.slice(-1)); // Only keep latest file
  };

  const handleAnalyze = async () => {
    if (fileList.length === 0) {
      message.warning('Please select or drag a PDF/DOCX work artifact first');
      return;
    }

    setAnalyzing(true);
    setCurrentStep(1);
    setAnalysisResult(null);

    // Simulate 4-step analysis progress for realistic UX
    setTimeout(() => setCurrentStep(2), 800);
    setTimeout(() => setCurrentStep(3), 1600);

    setTimeout(async () => {
      const formData = new FormData();
      formData.append('file', fileList[0].originFileObj || fileList[0]);
      formData.append('officer_id', officerId);
      const res = await uploadArtifact(formData);
      if (res.error || !res.data) {
        setAnalysisResult({
          error: true,
          document_name: fileList[0].name,
          summary: 'Work artifact analysis is not available from the backend for this officer yet.',
        });
        message.warning('Backend work artifact analysis is not available yet.');
      } else {
        setAnalysisResult(res.data);
        message.success('Work artifact analyzed successfully!');
      }
      setAnalyzing(false);
      setCurrentStep(4);
    }, 2400);
  };

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, color: '#0C447C' }}>
          WORK EVIDENCE
        </Title>
        <Text type="secondary">
          Upload work artifacts (sampling plans, survey designs, statistical reports) to provide evidence of applied competency.
        </Text>
      </div>

      <Row gutter={[24, 24]}>
        {/* Left Column: Upload Area & Stepper */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <InboxOutlined style={{ color: '#0C447C' }} />
                <span>Upload Document</span>
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 24 }}
          >
            <Dragger
              accept=".pdf,.docx,.doc"
              fileList={fileList}
              onChange={handleUploadChange}
              beforeUpload={() => false} // Prevent auto-POST
              maxCount={1}
              style={{ padding: 20, background: '#F8FAFC', borderRadius: 8 }}
            >
              <p className="ant-upload-drag-icon">
                <FilePdfOutlined style={{ fontSize: 42, color: '#0C447C' }} />
              </p>
              <p className="ant-upload-text" style={{ fontWeight: 600, color: '#0C447C' }}>
                Click or drag file to this area to upload
              </p>
              <p className="ant-upload-hint" style={{ fontSize: 12, color: '#64748B' }}>
                Supported formats: PDF, DOCX (e.g. Sampling Plan, Survey Design, Data Quality Report)
              </p>
            </Dragger>

            <Button
              type="primary"
              size="large"
              icon={analyzing ? <LoadingOutlined /> : <ThunderboltOutlined />}
              onClick={handleAnalyze}
              disabled={analyzing || fileList.length === 0}
              style={{ marginTop: 20, width: '100%', background: '#0C447C' }}
            >
              {analyzing ? 'Analyzing Artifact...' : 'Analyze Evidence'}
            </Button>
          </Card>

          {/* Stepper Process */}
          {(analyzing || currentStep > 0) && (
            <Card title="Analysis Stepper Progress" bordered={false} style={{ borderRadius: 10 }}>
              <Steps
                direction="vertical"
                size="small"
                current={currentStep}
                items={[
                  { title: 'Document Uploaded', description: 'File received and formatted' },
                  { title: 'Content Extraction', description: 'Extracting text and metadata' },
                  { title: 'Competency Identification', description: 'Matching concepts against FRAC framework' },
                  { title: 'Evidence Score Generation', description: 'Calculating confidence and score' },
                ]}
              />
            </Card>
          )}
        </Col>

        {/* Right Column: AI Analysis Result */}
        <Col xs={24} lg={12}>
          {analysisResult ? (
            <Card
              title={
                <Space>
                  <SafetyCertificateOutlined style={{ color: '#52C41A' }} />
                  <span style={{ color: '#0C447C' }}>AI WORK EVIDENCE ANALYSIS</span>
                </Space>
              }
              bordered={false}
              style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderTop: '4px solid #0C447C' }}
            >
              <Alert
                message={analysisResult.error ? 'No Backend Artifact Analysis Available' : 'AI-Assisted Competency Evidence'}
                description={analysisResult.error ? analysisResult.summary : 'Evidence scores are derived using the backend evidence pipeline and contribute to this officer only.'}
                type={analysisResult.error ? 'warning' : 'success'}
                showIcon
                style={{ marginBottom: 20 }}
              />

              <div style={{ marginBottom: 16 }}>
                <Text type="secondary" style={{ fontSize: 11 }}>ANALYZED DOCUMENT</Text>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0C447C' }}>
                  {analysisResult.document_name}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <Text type="secondary" style={{ fontSize: 11 }}>EVIDENCE CONFIDENCE</Text>
                <div>
                  <Tag color="blue" style={{ fontSize: 13, padding: '2px 10px', marginTop: 4 }}>
                    {analysisResult.confidence} Confidence
                  </Tag>
                </div>
              </div>

              <Title level={5} style={{ color: '#0C447C', marginBottom: 12 }}>
                Detected Competencies & Applied Scores:
              </Title>

              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                {(analysisResult.detected_competencies || []).map((comp, idx) => {
                  const compName = typeof comp === 'string' ? comp : comp.name;
                  const compScore = typeof comp === 'string' ? 75 : comp.score;
                  return (
                    <div key={idx} style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text strong style={{ fontSize: 13 }}>{compName}</Text>
                        <Text strong style={{ color: '#0C447C' }}>{compScore}%</Text>
                      </div>
                      <Progress percent={compScore} strokeColor="#0C447C" showInfo={false} />
                    </div>
                  );
                })}
              </Space>

              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #E2E8F0' }}>
                <Text type="secondary" style={{ fontSize: 11 }}>EVIDENCE SUMMARY</Text>
                <Paragraph style={{ fontSize: 13, color: '#334155', marginTop: 4 }}>
                  "{analysisResult.summary}"
                </Paragraph>
              </div>
            </Card>
          ) : (
            <Card
              bordered={false}
              style={{
                borderRadius: 10,
                textAlign: 'center',
                padding: '60px 20px',
                background: '#FAFBFD',
                border: '1px dashed #CBD5E1',
              }}
            >
              <InboxOutlined style={{ fontSize: 54, color: '#94A3B8', marginBottom: 16 }} />
              <Title level={4} style={{ color: '#475569' }}>
                No Work Evidence Analyzed Yet
              </Title>
              <Paragraph style={{ color: '#64748B', maxWidth: 360, margin: '0 auto' }}>
                Upload a relevant work artifact (e.g. sampling plan, statistical report) to extract AI-assisted evidence and strengthen your overall score.
              </Paragraph>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
}
