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
    <div className="w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0B2641] m-0">
          Upload Work Evidence
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-[#617487]">
          Upload work artifacts (sampling plans, survey designs, statistical reports) to extract verified competency evidence.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload Area & Stepper */}
        <div className="lg:col-span-6 space-y-6">
          <div className="rounded-2xl border border-[#DCE7F0] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#F1F6FA]">
              <InboxOutlined className="text-lg text-[#2966A3]" />
              <h3 className="text-sm font-bold text-[#0B2641] m-0">Select & Upload Document</h3>
            </div>

            <Dragger
              accept=".pdf,.docx,.doc"
              fileList={fileList}
              onChange={handleUploadChange}
              beforeUpload={() => false}
              maxCount={1}
              style={{ padding: 20, background: '#F8FBFD', borderRadius: 12, borderColor: '#D1E0EE' }}
            >
              <p className="ant-upload-drag-icon">
                <FilePdfOutlined style={{ fontSize: 44, color: '#2966A3' }} />
              </p>
              <p className="ant-upload-text" style={{ fontWeight: 700, color: '#0B2641', fontSize: 14 }}>
                Click or drag official artifact to upload
              </p>
              <p className="ant-upload-hint" style={{ fontSize: 12, color: '#617487' }}>
                Supported formats: PDF, DOCX (e.g. Sampling Plan, Survey Quality Audit)
              </p>
            </Dragger>

            <Button
              type="primary"
              size="large"
              icon={analyzing ? <LoadingOutlined /> : <ThunderboltOutlined />}
              onClick={handleAnalyze}
              disabled={analyzing || fileList.length === 0}
              className="!mt-5 !h-11 !w-full !rounded-xl !bg-[#2966A3] !text-sm !font-semibold hover:!bg-[#0B2641]"
            >
              {analyzing ? 'Analyzing Statistical Artifact...' : 'Analyze Evidence'}
            </Button>
          </div>

          {/* Stepper Process */}
          {(analyzing || currentStep > 0) && (
            <div className="rounded-2xl border border-[#DCE7F0] bg-white p-6 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#617487] mb-4">
                Analysis Stepper Progress
              </h4>
              <Steps
                direction="vertical"
                size="small"
                current={currentStep}
                items={[
                  { title: 'Document Uploaded', description: 'File received and parsed' },
                  { title: 'Content Extraction', description: 'Extracting text and statistical methodology' },
                  { title: 'Competency Identification', description: 'Matching concepts against FRAC framework' },
                  { title: 'Evidence Score Generation', description: 'Calculating confidence and score delta' },
                ]}
              />
            </div>
          )}
        </div>

        {/* Right Column: AI Analysis Result */}
        <div className="lg:col-span-6">
          {analysisResult ? (
            <div className="rounded-2xl border border-[#DCE7F0] bg-white p-6 shadow-sm border-t-4 border-t-[#2966A3]">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#F1F6FA]">
                <SafetyCertificateOutlined className="text-lg text-[#3D7D70]" />
                <h3 className="text-sm font-bold text-[#0B2641] m-0">AI Work Evidence Analysis</h3>
              </div>

              <Alert
                message={analysisResult.error ? 'No Backend Artifact Analysis Available' : 'AI-Assisted Competency Evidence Extracted'}
                description={analysisResult.error ? analysisResult.summary : 'Evidence scores are derived using the backend NLP pipeline and recorded in your historical checkpoint.'}
                type={analysisResult.error ? 'warning' : 'success'}
                showIcon
                className="!mb-5 !rounded-xl"
              />

              <div className="grid grid-cols-2 gap-3 mb-5 bg-[#F8FBFD] p-3.5 rounded-xl border border-[#DCE7F0]">
                <div>
                  <span className="block text-[10px] font-bold text-[#617487] uppercase">ANALYZED DOCUMENT</span>
                  <span className="font-bold text-xs text-[#0B2641] truncate block">{analysisResult.document_name}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-[#617487] uppercase">CONFIDENCE</span>
                  <Tag color="blue" className="!m-0 !font-semibold !text-[11px]">{analysisResult.confidence} Confidence</Tag>
                </div>
              </div>

              <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B2641] mb-3">
                Detected Competencies & Applied Scores:
              </h4>

              <div className="space-y-3">
                {(analysisResult.detected_competencies || []).map((comp, idx) => {
                  const compName = typeof comp === 'string' ? comp : comp.name;
                  const compScore = typeof comp === 'string' ? 75 : comp.score;
                  return (
                    <div key={idx} className="bg-[#F8FBFD] p-3 rounded-xl border border-[#DCE7F0]">
                      <div className="flex justify-between items-center mb-1.5 text-xs">
                        <span className="font-bold text-[#0B2641]">{compName}</span>
                        <span className="font-bold text-[#2966A3]">{compScore}%</span>
                      </div>
                      <Progress percent={compScore} strokeColor="#2966A3" showInfo={false} />
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 pt-4 border-t border-[#DCE7F0]">
                <span className="block text-[10px] font-bold text-[#617487] uppercase mb-1">EVIDENCE SUMMARY</span>
                <p className="text-xs text-[#172B3D] leading-relaxed bg-[#F8FBFD] p-3 rounded-xl border border-[#DCE7F0] m-0">
                  &ldquo;{analysisResult.summary}&rdquo;
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#D1E0EE] bg-[#F8FBFD] p-10 sm:p-14 text-center">
              <InboxOutlined className="text-5xl text-[#8AA0B2] mb-3" />
              <h3 className="text-base font-bold text-[#0B2641] m-0 mb-1">
                No Work Evidence Analyzed Yet
              </h3>
              <p className="text-xs text-[#617487] max-w-sm mx-auto leading-relaxed">
                Upload a relevant work artifact (e.g. sampling plan, statistical report) to extract AI-assisted evidence and strengthen your competency passport.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
