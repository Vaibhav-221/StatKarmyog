/**
 * QuizPage — AI Quiz Generator, MCQ Interface & Before/After Re-Assessment Result.
 */

import React, { useState } from 'react';
import {
  Row,
  Col,
  Card,
  Typography,
  Select,
  Radio,
  Button,
  Progress,
  Steps,
  Space,
  Tag,
  Alert,
  Upload,
  Result,
  message,
} from 'antd';
import {
  ThunderboltOutlined,
  FilePdfOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  ArrowRightOutlined,
  SafetyCertificateOutlined,
  RiseOutlined,
  FormOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

export default function QuizPage() {
  const navigate = useNavigate();

  // State workflow: 'generator' | 'generating' | 'quiz' | 'result'
  const [stage, setStage] = useState('generator');
  const [generationStep, setGenerationStep] = useState(0);

  // Form selections
  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [selectedCompetency, setSelectedCompetency] = useState('Sampling Methodology');

  // Quiz state
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});

  const sampleQuestions = [
    {
      id: 1,
      question: 'Which sampling method is most appropriate when the population is divided into distinct subgroups (strata)?',
      options: [
        { key: 'A', text: 'Simple Random Sampling' },
        { key: 'B', text: 'Stratified Random Sampling' },
        { key: 'C', text: 'Systematic Sampling' },
        { key: 'D', text: 'Cluster Sampling' },
      ],
      correctKey: 'B',
    },
    {
      id: 2,
      question: 'In official statistical sample surveys, what does Primary Sampling Unit (PSU) refer to?',
      options: [
        { key: 'A', text: 'The final individual household surveyed' },
        { key: 'B', text: 'The first-stage sampling unit, such as a census village or urban block' },
        { key: 'C', text: 'The non-sampling error rate' },
        { key: 'D', text: 'The variance multiplier' },
      ],
      correctKey: 'B',
    },
    {
      id: 3,
      question: 'What is the principal advantage of using proportional allocation in stratified sampling?',
      options: [
        { key: 'A', text: 'Minimizes variance for a given sample size across heterogeneous strata' },
        { key: 'B', text: 'Eliminates non-response bias' },
        { key: 'C', text: 'Ensures equal sample sizes regardless of stratum population' },
        { key: 'D', text: 'Replaces census data completely' },
      ],
      correctKey: 'A',
    },
  ];

  const handleGenerateQuiz = () => {
    setStage('generating');
    setGenerationStep(0);

    setTimeout(() => setGenerationStep(1), 600);
    setTimeout(() => setGenerationStep(2), 1200);
    setTimeout(() => setGenerationStep(3), 1800);
    setTimeout(() => setGenerationStep(4), 2400);

    setTimeout(() => {
      setStage('quiz');
      message.success('AI Quiz generated successfully!');
    }, 3000);
  };

  const handleOptionSelect = (qId, optionKey) => {
    setUserAnswers((prev) => ({ ...prev, [qId]: optionKey }));
  };

  const handleSubmitQuiz = () => {
    setStage('result');
    message.success('Quiz submitted! Competency Passport score updated.');
  };

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      {/* Stage 1: AI QUIZ GENERATOR CONTROLS */}
      {stage === 'generator' && (
        <div>
          <div style={{ marginBottom: 24 }}>
            <Title level={3} style={{ margin: 0, color: '#0C447C' }}>
              AI QUIZ GENERATOR
            </Title>
            <Text type="secondary">
              Generate validated MCQs from uploaded course materials or statistical guidelines.
            </Text>
          </div>

          <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Space direction="vertical" style={{ width: '100%' }} size={20}>
              <div>
                <Text strong style={{ color: '#0C447C', fontSize: 14 }}>1. Target Competency:</Text>
                <Select
                  value={selectedCompetency}
                  onChange={setSelectedCompetency}
                  style={{ width: '100%', marginTop: 8 }}
                  options={[
                    { value: 'Sampling Methodology', label: 'Sampling Methodology (High Gap - 31 pts)' },
                    { value: 'Survey Design', label: 'Survey Design (Near Target - 7 pts)' },
                    { value: 'Data Quality', label: 'Data Quality (Near Target - 8 pts)' },
                    { value: 'Statistical Analysis', label: 'Statistical Analysis (Moderate Gap - 17 pts)' },
                  ]}
                />
              </div>

              <div>
                <Text strong style={{ color: '#0C447C', fontSize: 14 }}>2. Number of Questions:</Text>
                <div style={{ marginTop: 8 }}>
                  <Radio.Group value={numQuestions} onChange={(e) => setNumQuestions(e.target.value)} buttonStyle="solid">
                    <Radio.Button value={5}>5 Questions</Radio.Button>
                    <Radio.Button value={10}>10 Questions</Radio.Button>
                    <Radio.Button value={15}>15 Questions</Radio.Button>
                  </Radio.Group>
                </div>
              </div>

              <div>
                <Text strong style={{ color: '#0C447C', fontSize: 14 }}>3. Difficulty Level:</Text>
                <div style={{ marginTop: 8 }}>
                  <Radio.Group value={difficulty} onChange={(e) => setDifficulty(e.target.value)} buttonStyle="solid">
                    <Radio.Button value="Basic">Basic</Radio.Button>
                    <Radio.Button value="Intermediate">Intermediate</Radio.Button>
                    <Radio.Button value="Advanced">Advanced</Radio.Button>
                  </Radio.Group>
                </div>
              </div>

              <div>
                <Text strong style={{ color: '#0C447C', fontSize: 14 }}>4. Learning Material Source (Optional):</Text>
                <Upload.Dragger accept=".pdf,.docx" maxCount={1} beforeUpload={() => false} style={{ marginTop: 8, padding: 16 }}>
                  <p className="ant-upload-drag-icon">
                    <FilePdfOutlined style={{ fontSize: 32, color: '#0C447C' }} />
                  </p>
                  <p className="ant-upload-text" style={{ fontSize: 13 }}>Click or drag learning document to generate MCQs</p>
                </Upload.Dragger>
              </div>

              <Button
                type="primary"
                size="large"
                icon={<ThunderboltOutlined />}
                onClick={handleGenerateQuiz}
                style={{ background: '#0C447C', marginTop: 12, width: '100%' }}
              >
                Generate Quiz
              </Button>
            </Space>
          </Card>
        </div>
      )}

      {/* Stage 2: GENERATION PROCESS STEPPER */}
      {stage === 'generating' && (
        <Card bordered={false} style={{ borderRadius: 10, textAlign: 'center', padding: 40 }}>
          <Title level={4} style={{ color: '#0C447C', marginBottom: 24 }}>
            Generating AI MCQs for {selectedCompetency}...
          </Title>

          <Steps
            current={generationStep}
            items={[
              { title: 'Learning Material' },
              { title: 'Text Extraction' },
              { title: 'Concept ID' },
              { title: 'LLM MCQ Generation' },
              { title: 'Competency Tagging' },
            ]}
            style={{ maxWidth: 700, margin: '0 auto 30px' }}
          />

          <LoadingOutlined style={{ fontSize: 36, color: '#0C447C' }} />
        </Card>
      )}

      {/* Stage 3: MCQ QUIZ INTERFACE */}
      {stage === 'quiz' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Title level={4} style={{ margin: 0, color: '#0C447C' }}>
              Competency Assessment: {selectedCompetency}
            </Title>
            <Tag color="blue">Question {currentQIndex + 1} of {sampleQuestions.length}</Tag>
          </div>

          <Progress percent={((currentQIndex + 1) / sampleQuestions.length) * 100} strokeColor="#0C447C" showInfo={false} style={{ marginBottom: 20 }} />

          <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 20 }}>
            <Title level={5} style={{ color: '#334155', marginBottom: 20 }}>
              Q{currentQIndex + 1}. {sampleQuestions[currentQIndex].question}
            </Title>

            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              {sampleQuestions[currentQIndex].options.map((opt) => {
                const isSelected = userAnswers[sampleQuestions[currentQIndex].id] === opt.key;
                return (
                  <div
                    key={opt.key}
                    onClick={() => handleOptionSelect(sampleQuestions[currentQIndex].id, opt.key)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 8,
                      border: isSelected ? '2px solid #0C447C' : '1px solid #E2E8F0',
                      background: isSelected ? '#F0F7FF' : '#fff',
                      cursor: 'pointer',
                      fontSize: 14,
                      color: isSelected ? '#0C447C' : '#334155',
                      fontWeight: isSelected ? 600 : 400,
                    }}
                  >
                    <strong>{opt.key}.</strong> {opt.text}
                  </div>
                );
              })}
            </Space>
          </Card>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              disabled={currentQIndex === 0}
              onClick={() => setCurrentQIndex((i) => i - 1)}
            >
              Previous
            </Button>

            {currentQIndex < sampleQuestions.length - 1 ? (
              <Button type="primary" onClick={() => setCurrentQIndex((i) => i + 1)} style={{ background: '#0C447C' }}>
                Next
              </Button>
            ) : (
              <Button type="primary" onClick={handleSubmitQuiz} style={{ background: '#52C41A', borderColor: '#52C41A' }}>
                Submit Assessment
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Stage 4: QUIZ RESULT & BEFORE / AFTER RE-ASSESSMENT */}
      {stage === 'result' && (
        <Card bordered={false} style={{ borderRadius: 10, textAlign: 'center', padding: 30 }}>
          <Result
            status="success"
            title="QUIZ COMPLETED & RE-ASSESSMENT RECORDED!"
            subTitle={`Competency: ${selectedCompetency}`}
          />

          <Row gutter={[24, 24]} justify="center" style={{ marginTop: 20, marginBottom: 30 }}>
            <Col xs={24} md={16}>
              <div style={{ background: '#F8FAFC', padding: 24, borderRadius: 10, border: '1px solid #E2E8F0' }}>
                <Row gutter={16} align="middle">
                  <Col span={8}>
                    <Text type="secondary" style={{ fontSize: 12 }}>BEFORE LEARNING</Text>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#64748B' }}>54%</div>
                  </Col>
                  <Col span={8}>
                    <Text type="secondary" style={{ fontSize: 12 }}>AFTER QUIZ</Text>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#0C447C' }}>82%</div>
                  </Col>
                  <Col span={8}>
                    <Text type="secondary" style={{ fontSize: 12 }}>IMPROVEMENT</Text>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#389E0D' }}>+28 pts</div>
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>

          <Button
            type="primary"
            size="large"
            icon={<SafetyCertificateOutlined />}
            onClick={() => navigate('/passport')}
            style={{ background: '#0C447C' }}
          >
            View Competency Passport
          </Button>
        </Card>
      )}
    </div>
  );
}
