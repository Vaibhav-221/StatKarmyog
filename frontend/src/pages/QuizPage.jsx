/**
 * QuizPage — AI Quiz Generator, MCQ Interface & Before/After Re-Assessment Result.
 */

import React, { useState, useEffect } from 'react';
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
import { useNavigate, useSearchParams } from 'react-router-dom';

import { generateQuizApi, submitQuizApi, getGapAnalysis } from '../api/client';
import { useAuth } from '../context/AuthContext';

const { Title, Text, Paragraph } = Typography;

export default function QuizPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const officerId = user?.officer_id || 'OFF001';
  const requestedCompetency = searchParams.get('competency') || '';
  const requestedArtifactId = searchParams.get('artifact_id') || '';

  // State workflow: 'generator' | 'generating' | 'quiz' | 'result'
  const [stage, setStage] = useState('generator');
  const [generationStep, setGenerationStep] = useState(0);

  // Form selections
  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [selectedCompetency, setSelectedCompetency] = useState('');
  const [competencyOptions, setCompetencyOptions] = useState([]);
  const [loadingGaps, setLoadingGaps] = useState(true);
  const [fileList, setFileList] = useState([]);

  // Quiz state
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [attemptId, setAttemptId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [submitResult, setSubmitResult] = useState(null);

  // Fetch officer-specific competency gaps for target competency selection
  useEffect(() => {
    async function fetchOfficerGaps() {
      setLoadingGaps(true);
      try {
        const res = await getGapAnalysis(officerId);
        const gaps = res.data?.gaps || [];
        if (gaps.length > 0) {
          const opts = gaps.map((g) => ({
            value: g.skill,
            label: `${g.skill} (Gap: ${g.gap_size} pts)`,
          }));
          if (requestedCompetency && !opts.some((item) => item.value === requestedCompetency)) {
            opts.unshift({ value: requestedCompetency, label: `${requestedCompetency} (from work artifact)` });
          }
          setCompetencyOptions(opts);
          setSelectedCompetency(requestedCompetency || opts[0].value);
        } else {
          const fallbackOpts = [
            { value: 'Survey Design', label: 'Survey Design' },
            { value: 'Sampling', label: 'Sampling' },
            { value: 'Data Quality Frameworks', label: 'Data Quality Frameworks' },
            { value: 'Industrial Statistics', label: 'Industrial Statistics' },
          ];
          if (requestedCompetency && !fallbackOpts.some((item) => item.value === requestedCompetency)) {
            fallbackOpts.unshift({ value: requestedCompetency, label: `${requestedCompetency} (from work artifact)` });
          }
          setCompetencyOptions(fallbackOpts);
          setSelectedCompetency(requestedCompetency || fallbackOpts[0].value);
        }
      } catch (err) {
        console.error('[QuizPage] Failed to fetch officer gaps:', err);
      } finally {
        setLoadingGaps(false);
      }
    }
    fetchOfficerGaps();
  }, [officerId, requestedCompetency]);

  const handleGenerateQuiz = async () => {
    setStage('generating');
    setGenerationStep(0);

    const stepTimer1 = setTimeout(() => setGenerationStep(1), 600);
    const stepTimer2 = setTimeout(() => setGenerationStep(2), 1200);
    const stepTimer3 = setTimeout(() => setGenerationStep(3), 1800);
    const stepTimer4 = setTimeout(() => setGenerationStep(4), 2400);

    try {
      const formData = new FormData();
      if (fileList.length > 0) {
        formData.append('file', fileList[0].originFileObj || fileList[0]);
      }
      const difficultyMap = { Basic: 'easy', Intermediate: 'medium', Advanced: 'hard' };
      formData.append('difficulty', difficultyMap[difficulty] || 'medium');
      formData.append('language', 'en');
      formData.append('num_questions', String(numQuestions));
      formData.append('officer_id', officerId);
      if (selectedCompetency) {
        formData.append('target_competency', selectedCompetency);
      }
      if (requestedArtifactId) {
        formData.append('artifact_id', requestedArtifactId);
      }

      const res = await generateQuizApi(formData);

      if (res.error || !res.data?.attempt_id || !Array.isArray(res.data?.questions)) {
        message.error('Quiz generation failed. Please try another learning material or reduce the number of questions.', 6);
        setStage('generator');
        return;
      }

      setAttemptId(res.data.attempt_id);
      setQuestions(res.data.questions);
      setUserAnswers({});
      setCurrentQIndex(0);
      setStage('quiz');
      message.success('AI Quiz generated successfully!');
    } catch (err) {
      console.error('[QuizPage] Error in quiz generation:', err);
      message.error(`An unexpected error occurred: ${err.message || err}`, 6);
      setStage('generator');
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      clearTimeout(stepTimer4);
    }
  };

  const handleOptionSelect = (qId, optionKey) => {
    setUserAnswers((prev) => ({ ...prev, [qId]: optionKey }));
  };

  const handleSubmitQuiz = async () => {
    const payload = {
      attempt_id: attemptId,
      officer_id: officerId,
      answers: questions.map((_, index) => userAnswers[index]),
    };
    if (!attemptId || payload.answers.some((answer) => answer === undefined)) {
      message.warning('Please answer every question before submitting.');
      return;
    }
    try {
      const res = await submitQuizApi(payload);
      if (res.error || !res.data) {
        const errorMsg = res.message || 'Quiz submission failed. No competency score was recorded.';
        message.error(errorMsg, 6);
        return;
      }
      setSubmitResult(res.data);
      setStage('result');
      message.success('Quiz submitted! Competency Passport score updated.');
    } catch (err) {
      console.error('[QuizPage] Submission error:', err);
      message.error(`Submission error: ${err.message || err}`, 6);
    }
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
              Generate validated MCQs from uploaded course materials, officer competency gaps, or assigned work artifacts.
            </Text>
          </div>

          <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <Space direction="vertical" style={{ width: '100%' }} size={20}>
              <div>
                <Text strong style={{ color: '#0C447C', fontSize: 14 }}>1. Target Competency ({user?.name || officerId}):</Text>
                <Select
                  value={selectedCompetency}
                  onChange={setSelectedCompetency}
                  loading={loadingGaps}
                  style={{ width: '100%', marginTop: 8 }}
                  options={competencyOptions}
                />
              </div>

              <div>
                <Text strong style={{ color: '#0C447C', fontSize: 14 }}>2. Number of Questions:</Text>
                <div style={{ marginTop: 8 }}>
                  <Radio.Group value={numQuestions} onChange={(e) => setNumQuestions(e.target.value)} buttonStyle="solid">
                    <Radio.Button value={5}>5</Radio.Button>
                    <Radio.Button value={10}>10</Radio.Button>
                    <Radio.Button value={15}>15</Radio.Button>
                    <Radio.Button value={20}>20</Radio.Button>
                  </Radio.Group>
                </div>
              </div>

              <div>
                <Text strong style={{ color: '#0C447C', fontSize: 14 }}>3. Difficulty Level:</Text>
                <div style={{ marginTop: 8 }}>
                  <Radio.Group value={difficulty} onChange={(e) => setDifficulty(e.target.value)} buttonStyle="solid">
                    <Radio.Button value="Basic">Easy</Radio.Button>
                    <Radio.Button value="Intermediate">Intermediate</Radio.Button>
                    <Radio.Button value="Advanced">Advanced</Radio.Button>
                  </Radio.Group>
                </div>
              </div>

              <div>
                <Text strong style={{ color: '#0C447C', fontSize: 14 }}>4. Learning Material Source (Optional):</Text>
                <Upload.Dragger
                  accept=".pdf,.docx,.txt,.md"
                  maxCount={1}
                  beforeUpload={() => false}
                  fileList={fileList}
                  onChange={({ fileList: nextFileList }) => setFileList(nextFileList.slice(-1))}
                  style={{ marginTop: 8, padding: 16 }}
                >
                  <p className="ant-upload-drag-icon">
                    <FilePdfOutlined style={{ fontSize: 32, color: '#0C447C' }} />
                  </p>
                  <p className="ant-upload-text" style={{ fontSize: 13 }}>Click or drag learning document to generate MCQs</p>
                </Upload.Dragger>
                {requestedArtifactId && (
                  <Tag color="blue" style={{ marginTop: 10 }}>
                    Linked Artifact: {requestedArtifactId}
                  </Tag>
                )}
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
            <Tag color="blue">Question {currentQIndex + 1} of {questions.length}</Tag>
          </div>

          <Progress percent={((currentQIndex + 1) / questions.length) * 100} strokeColor="#0C447C" showInfo={false} style={{ marginBottom: 20 }} />

          <Card bordered={false} style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: 20 }}>
            <Title level={5} style={{ color: '#334155', marginBottom: 20 }}>
              Q{currentQIndex + 1}. {questions[currentQIndex].question}
            </Title>

            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              {questions[currentQIndex].options.map((opt, optionIndex) => {
                const isSelected = userAnswers[currentQIndex] === optionIndex;
                return (
                  <div
                    key={optionIndex}
                    onClick={() => handleOptionSelect(currentQIndex, optionIndex)}
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
                    <strong>{String.fromCharCode(65 + optionIndex)}.</strong> {opt}
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

            {currentQIndex < questions.length - 1 ? (
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
                    <Text type="secondary" style={{ fontSize: 12 }}>QUIZ SCORE</Text>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#64748B' }}>
                      {submitResult?.score_summary?.[0]?.quiz_score ? `${Math.round(submitResult.score_summary[0].quiz_score * 20)}%` : 'Recorded'}
                    </div>
                  </Col>
                  <Col span={8}>
                    <Text type="secondary" style={{ fontSize: 12 }}>COMBINED SCORE</Text>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#0C447C' }}>
                      {submitResult?.score_summary?.[0]?.combined_score ? `${Math.round(submitResult.score_summary[0].combined_score * 20)}%` : 'Recorded'}
                    </div>
                  </Col>
                  <Col span={8}>
                    <Text type="secondary" style={{ fontSize: 12 }}>RECORDED</Text>
                    <div style={{ fontSize: 24, fontWeight: 700, color: '#389E0D' }}>
                      {submitResult?.score_summary?.length || 0} competency score(s)
                    </div>
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
