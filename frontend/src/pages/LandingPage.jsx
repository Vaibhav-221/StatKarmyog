/**
 * LandingPage — High-impact landing page for STATKARMAYOG.
 *
 * Prototype built for Smart India Hackathon 2026 (Problem Statement SIH26101)
 * Target: Ministry of Statistics and Programme Implementation (MoSPI) / NSSTA
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Button, Typography, Tag, Space, Badge, Avatar, message } from 'antd';
import {
  SafetyCertificateOutlined,
  ArrowRightOutlined,
  ThunderboltOutlined,
  RiseOutlined,
  BookOutlined,
  FilePdfOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
  UserOutlined,
  RocketOutlined,
  SolutionOutlined,
  CompassOutlined,
} from '@ant-design/icons';
import AppHeader from '../components/AppHeader';
import { useAuth } from '../context/AuthContext';
import { MOCK_OFFICERS } from '../api/client';

const { Title, Text, Paragraph } = Typography;

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const handleQuickLogin = (officer) => {
    setUser({
      officer_id: officer.officer_id,
      name: officer.name,
      designation: officer.designation,
      department: officer.department,
      role: officer.role || 'officer',
    });
    message.success(`Logged in as ${officer.name} (${officer.designation})`);
    navigate(officer.role === 'admin' ? '/admin' : '/dashboard');
  };

  const handleStepClick = (route) => {
    if (user) {
      navigate(route);
    } else {
      navigate('/login');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <AppHeader showUser={true} isLanding={true} />

      {/* Hero Section */}
      <div
        id="hero"
        style={{
          background: 'linear-gradient(135deg, #0C447C 0%, #0F2D52 100%)',
          color: '#fff',
          padding: '80px 24px 90px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ maxWidth: 980, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <Tag
            color="blue"
            style={{
              fontSize: 13,
              padding: '4px 16px',
              borderRadius: 20,
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.25)',
              color: '#93C5FD',
              marginBottom: 20,
              fontWeight: 600,
            }}
          >
            🇮🇳 Smart India Hackathon 2026 • Problem Statement SIH26101
          </Tag>

          <Title
            level={1}
            style={{
              color: '#ffffff',
              fontSize: 48,
              fontWeight: 800,
              letterSpacing: '-1px',
              margin: '0 0 16px',
              lineHeight: 1.15,
            }}
          >
            STATKARMAYOG
          </Title>

          <Title
            level={3}
            style={{
              color: '#93C5FD',
              fontWeight: 600,
              margin: '0 0 24px',
              fontSize: 22,
            }}
          >
            AI-Enabled Skill Intelligence & Competency Development Platform
          </Title>

          <Paragraph
            style={{
              color: '#E2E8F0',
              fontSize: 16,
              maxWidth: 780,
              margin: '0 auto 36px',
              lineHeight: 1.6,
            }}
          >
            Empowering India's Official Statistical System (MoSPI / NSSTA) with automated competency gap analysis, multi-source evidence extraction, iGOT Karmayogi integration, and dynamic LLM quiz generation.
          </Paragraph>

          <Space size={16} wrap style={{ justifyContent: 'center' }}>
            {user ? (
              <>
                <Button
                  type="primary"
                  size="large"
                  icon={<RocketOutlined />}
                  onClick={() => navigate(user.role === 'admin' ? '/admin' : '/dashboard')}
                  style={{
                    height: 52,
                    padding: '0 36px',
                    fontSize: 16,
                    fontWeight: 700,
                    borderRadius: 10,
                    background: '#2563EB',
                    border: 'none',
                    boxShadow: '0 4px 14px rgba(37,99,235,0.4)',
                  }}
                >
                  Go to Officer Dashboard
                </Button>

                <Button
                  size="large"
                  icon={<SafetyCertificateOutlined />}
                  onClick={() => navigate('/passport')}
                  style={{
                    height: 52,
                    padding: '0 32px',
                    fontSize: 16,
                    fontWeight: 600,
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    borderColor: 'rgba(255,255,255,0.3)',
                  }}
                >
                  View Passport
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="primary"
                  size="large"
                  icon={<ArrowRightOutlined />}
                  onClick={() => navigate('/login')}
                  style={{
                    height: 52,
                    padding: '0 36px',
                    fontSize: 16,
                    fontWeight: 700,
                    borderRadius: 10,
                    background: '#2563EB',
                    border: 'none',
                    boxShadow: '0 4px 14px rgba(37,99,235,0.4)',
                  }}
                >
                  Get Started / Login
                </Button>

                <Button
                  size="large"
                  icon={<CompassOutlined />}
                  onClick={() => {
                    const el = document.getElementById('demo-profiles');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{
                    height: 52,
                    padding: '0 32px',
                    fontSize: 16,
                    fontWeight: 600,
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    borderColor: 'rgba(255,255,255,0.3)',
                  }}
                >
                  Explore Demo Profiles
                </Button>
              </>
            )}
          </Space>
        </div>
      </div>

      {/* Value Proposition Core Loop */}
      <div id="value-loop" style={{ marginTop: -40, padding: '0 24px', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <Card
            bordered={false}
            style={{
              borderRadius: 14,
              boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
              background: '#ffffff',
              padding: '12px 10px',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Text
                strong
                style={{
                  fontSize: 12,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  color: '#0C447C',
                }}
              >
                THE CORE PRODUCT VALUE LOOP
              </Text>
              <Title level={4} style={{ color: '#0C447C', margin: '4px 0 0' }}>
                "FROM IDENTIFYING COMPETENCY GAPS → TO PROVING COMPETENCY IMPROVEMENT"
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Click any step below to navigate directly into that stage of the framework.
              </Text>
            </div>

            <Row gutter={[16, 16]} align="stretch" justify="center">
              {[
                { title: '1. ROLE MAPPING', desc: 'FRAC Framework alignment (Role → Activities → Required Skills)', icon: <SafetyCertificateOutlined style={{ fontSize: 24, color: '#0C447C' }} />, route: '/profile' },
                { title: '2. EVIDENCE EXTRACT', desc: 'Quizzes + Work Artifact analysis (60/40 weighted formula)', icon: <FilePdfOutlined style={{ fontSize: 24, color: '#0C447C' }} />, route: '/upload-artifact' },
                { title: '3. GAP DIAGNOSTIC', desc: 'Calculates exact required vs current competency gap size', icon: <RiseOutlined style={{ fontSize: 24, color: '#D97706' }} />, route: '/gaps' },
                { title: '4. iGOT LEARNING', desc: 'ChromaDB semantic search recommends targeted iGOT modules', icon: <BookOutlined style={{ fontSize: 24, color: '#0C447C' }} />, route: '/learning' },
                { title: '5. AI MCQ QUIZ', desc: 'LLM generates dynamic MCQs from uploaded course content', icon: <ThunderboltOutlined style={{ fontSize: 24, color: '#0C447C' }} />, route: '/quiz' },
                { title: '6. PASSPORT STAMP', desc: 'Records verified improvement delta in Officer Passport', icon: <CheckCircleOutlined style={{ fontSize: 24, color: '#16A34A' }} />, route: '/passport' },
              ].map((step, idx) => (
                <Col xs={24} sm={12} md={8} lg={4} key={idx}>
                  <div
                    onClick={() => handleStepClick(step.route)}
                    style={{
                      background: '#F8FAFC',
                      padding: 16,
                      borderRadius: 10,
                      border: '1px solid #E2E8F0',
                      textAlign: 'center',
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                    className="value-step-card"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.borderColor = '#0C447C';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(12,68,124,0.12)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = '#E2E8F0';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div>
                      <div style={{ marginBottom: 10 }}>{step.icon}</div>
                      <Text strong style={{ fontSize: 13, color: '#0C447C', display: 'block', marginBottom: 4 }}>
                        {step.title}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 11, lineHeight: 1.3, display: 'block' }}>
                        {step.desc}
                      </Text>
                    </div>
                    <Text style={{ fontSize: 10, color: '#2563EB', marginTop: 10, fontWeight: 600 }}>
                      Explore Stage →
                    </Text>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </div>
      </div>

      {/* Key Feature Pillars */}
      <div id="pillars" style={{ padding: '60px 24px 40px', maxWidth: 1140, margin: '0 auto', flex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Title level={3} style={{ color: '#0C447C', margin: 0 }}>
            Platform Key Pillars
          </Title>
          <Text type="secondary">
            Built strictly around official statistical capabilities for JSO, SSO, and ISS Officers.
          </Text>
        </div>

        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
            <Card
              hoverable
              onClick={() => handleStepClick('/passport')}
              bordered={false}
              style={{
                borderRadius: 12,
                boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
                height: '100%',
                borderTop: '4px solid #0C447C',
              }}
            >
              <SafetyCertificateOutlined style={{ fontSize: 32, color: '#0C447C', marginBottom: 16 }} />
              <Title level={4} style={{ color: '#0C447C', fontSize: 18 }}>
                Competency Passport
              </Title>
              <Paragraph style={{ color: '#475569', fontSize: 13 }}>
                Maintains an immutable historical record of competency scores, evidence checkmarks, and growth trajectory line charts over time.
              </Paragraph>
              <Button type="link" style={{ padding: 0, color: '#0C447C', fontWeight: 600 }}>
                View Competency Passport →
              </Button>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card
              hoverable
              onClick={() => handleStepClick('/quiz')}
              bordered={false}
              style={{
                borderRadius: 12,
                boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
                height: '100%',
                borderTop: '4px solid #0C447C',
              }}
            >
              <ThunderboltOutlined style={{ fontSize: 32, color: '#0C447C', marginBottom: 16 }} />
              <Title level={4} style={{ color: '#0C447C', fontSize: 18 }}>
                AI Quiz Generator
              </Title>
              <Paragraph style={{ color: '#475569', fontSize: 13 }}>
                LangChain + Google Gemini integration automatically converts uploaded statistical guidelines and course documents into validated MCQs.
              </Paragraph>
              <Button type="link" style={{ padding: 0, color: '#0C447C', fontWeight: 600 }}>
                Try AI Quiz Generator →
              </Button>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card
              hoverable
              onClick={() => handleStepClick('/admin')}
              bordered={false}
              style={{
                borderRadius: 12,
                boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
                height: '100%',
                borderTop: '4px solid #0C447C',
              }}
            >
              <BarChartOutlined style={{ fontSize: 32, color: '#0C447C', marginBottom: 16 }} />
              <Title level={4} style={{ color: '#0C447C', fontSize: 18 }}>
                Training Intelligence
              </Title>
              <Paragraph style={{ color: '#475569', fontSize: 13 }}>
                Provides MoSPI and NSSTA leadership with anonymized, org-wide gap distributions and pre-vs-post training effectiveness analytics.
              </Paragraph>
              <Button type="link" style={{ padding: 0, color: '#0C447C', fontWeight: 600 }}>
                View Admin Analytics →
              </Button>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Quick Demo Access Section for Hackathon Evaluators */}
      <div id="demo-profiles" style={{ background: '#EFF6FF', padding: '60px 24px', borderTop: '1px solid #DBEAFE' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <Tag color="blue" style={{ marginBottom: 8, fontSize: 12, padding: '2px 12px' }}>
              PROTOTYPE DEMO PORTAL
            </Tag>
            <Title level={3} style={{ color: '#0C447C', margin: 0 }}>
              Quick Officer Access (SIH 2026 Evaluation)
            </Title>
            <Text type="secondary">
              Select any pre-configured official statistical profile to immediately test the platform with populated competencies & gap metrics.
            </Text>
          </div>

          <Row gutter={[20, 20]}>
            {[
              {
                officer_id: 'OFF001',
                name: 'Rakesh Kumar',
                designation: 'Junior Statistical Officer (JSO)',
                department: 'Industrial Statistics Division',
                role: 'officer',
                badge: 'JSO Profile',
                desc: 'Focus: Industrial Statistics, Sampling, Data Quality, Python',
                color: '#2563EB',
              },
              {
                officer_id: 'OFF002',
                name: 'Sunita Verma',
                designation: 'Senior Statistical Officer (SSO)',
                department: 'Price Statistics Division',
                role: 'officer',
                badge: 'SSO Profile',
                desc: 'Focus: CPI/WPI Indexing, Data Verification, Economic Data',
                color: '#059669',
              },
              {
                officer_id: 'OFF003',
                name: 'Arjun Nair',
                designation: 'ISS Officer - Director',
                department: 'Labour Statistics Division',
                role: 'officer',
                badge: 'ISS Officer',
                desc: 'Focus: Policy Evaluation, Sampling Design, Strategic Governance',
                color: '#7C3AED',
              },
              {
                officer_id: 'ADM001',
                name: 'Dr. Meena Agarwal',
                designation: 'Director — Training & Analytics',
                department: 'MoSPI / NSSTA Leadership',
                role: 'admin',
                badge: 'Admin & Leadership',
                desc: 'Focus: Org-wide Gap Intelligence, Training ROI & Effectiveness',
                color: '#DC2626',
              },
            ].map((prof) => (
              <Col xs={24} sm={12} lg={6} key={prof.officer_id}>
                <Card
                  bordered={false}
                  style={{
                    borderRadius: 12,
                    boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <Avatar size={40} style={{ backgroundColor: prof.color }}>
                        {prof.name.split(' ').map((n) => n[0]).join('')}
                      </Avatar>
                      <Tag color="blue" style={{ fontSize: 11, margin: 0, fontWeight: 600 }}>
                        {prof.badge}
                      </Tag>
                    </div>

                    <Title level={5} style={{ margin: '0 0 2px', color: '#0F172A' }}>
                      {prof.name}
                    </Title>
                    <Text strong style={{ fontSize: 12, color: '#0C447C', display: 'block', marginBottom: 6 }}>
                      {prof.designation}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 12 }}>
                      {prof.department}
                    </Text>
                    <Paragraph style={{ fontSize: 12, color: '#64748B', lineHeight: 1.4 }}>
                      {prof.desc}
                    </Paragraph>
                  </div>

                  <Button
                    type="primary"
                    block
                    icon={<UserOutlined />}
                    onClick={() => handleQuickLogin(prof)}
                    style={{
                      marginTop: 12,
                      background: prof.role === 'admin' ? '#DC2626' : '#0C447C',
                      fontWeight: 600,
                      borderRadius: 8,
                    }}
                  >
                    Launch as {prof.name.split(' ')[0]}
                  </Button>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* Bottom CTA Banner */}
      <div style={{ padding: '60px 24px', maxWidth: 1140, margin: '0 auto', width: '100%' }}>
        <Card
          bordered={false}
          style={{
            background: 'linear-gradient(135deg, #0C447C 0%, #1E3A8A 100%)',
            borderRadius: 14,
            padding: '36px 24px',
            color: '#fff',
            textAlign: 'center',
          }}
        >
          <Title level={3} style={{ color: '#ffffff', margin: '0 0 8px' }}>
            Ready to Explore STATKARMAYOG?
          </Title>
          <Paragraph style={{ color: '#E2E8F0', maxWidth: 640, margin: '0 auto 24px', fontSize: 15 }}>
            Experience the complete end-to-end competency development cycle for official statistics officers in India.
          </Paragraph>
          <Space size={16}>
            <Button
              type="primary"
              size="large"
              icon={<ArrowRightOutlined />}
              onClick={() => navigate('/login')}
              style={{ background: '#2563EB', height: 48, padding: '0 32px', fontWeight: 700, borderRadius: 8 }}
            >
              Open Login Portal
            </Button>
          </Space>
        </Card>
      </div>

      {/* Footer */}
      <div style={{ background: '#0F172A', color: '#94A3B8', padding: '32px 24px', textAlign: 'center', fontSize: 12 }}>
        <Space size={24} style={{ marginBottom: 12 }}>
          <a onClick={() => navigate('/')} style={{ color: '#94A3B8' }}>Home</a>
          <a onClick={() => navigate('/login')} style={{ color: '#94A3B8' }}>Officer Login</a>
          <a onClick={() => handleStepClick('/gaps')} style={{ color: '#94A3B8' }}>Gap Diagnostic</a>
          <a onClick={() => handleStepClick('/passport')} style={{ color: '#94A3B8' }}>Competency Passport</a>
          <a onClick={() => handleStepClick('/quiz')} style={{ color: '#94A3B8' }}>AI Quiz Generator</a>
        </Space>
        <div>
          StatKarmyog — Skill Intelligence & Competency Development Platform • Prototype for Smart India Hackathon 2026 (PS SIH26101)
        </div>
        <div style={{ marginTop: 4, color: '#64748B' }}>
          Ministry of Statistics and Programme Implementation (MoSPI) / National Statistical Systems Training Academy (NSSTA)
        </div>
      </div>
    </div>
  );
}

