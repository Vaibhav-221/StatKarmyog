/*
 * STATKARMAYOG — MoSPI-inspired visual theme
 *
 * Core palette:
 * Navy       #0B2641
 * Government blue #2966A3
 * Mist blue  #D1E0EE
 * Soft white #F8FBFD
 *
 * Supporting colors are intentionally restrained:
 * warm ochre for emphasis, muted teal for verified states,
 * muted red for administrative/status messaging, and slate text.
 *
 * The visual direction is informed by the official MoSPI website's
 * institutional, information-first presentation. The supplied palette
 * remains the source of truth for the main brand colors.
 *
 * Application logic, routes, authentication, handlers, content, and
 * component structure are preserved.
 */
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
    <div className="min-h-screen w-full overflow-x-hidden bg-[#F8FBFD] text-[#172B3D] flex flex-col">
      {/* Top Navbar */}
      <AppHeader showUser={true} isLanding={true} />

      {/* Hero Section */}
      <div
        id="hero"
        style={{
          background: 'linear-gradient(135deg, #0B2641 0%, #071B2E 100%)',
          color: '#fff',
          padding: 'clamp(48px, 8vw, 80px) clamp(16px, 4vw, 24px) clamp(56px, 9vw, 90px)',
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
              color: '#D1E0EE',
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
              fontSize: 'clamp(34px, 7vw, 48px)',
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
              color: '#D1E0EE',
              fontWeight: 600,
              margin: '0 0 24px',
              fontSize: 'clamp(17px, 3vw, 22px)',
            }}
          >
            AI-Enabled Skill Intelligence & Competency Development Platform
          </Title>

          <Paragraph
            style={{
              color: '#E8F0F7',
              fontSize: 'clamp(14px, 2vw, 16px)',
              maxWidth: 780,
              margin: '0 auto 36px',
              lineHeight: 1.6,
            }}
          >
            Empowering India's Official Statistical System (MoSPI / NSSTA) with automated competency gap analysis, multi-source evidence extraction, iGOT Karmayogi integration, and dynamic LLM quiz generation.
          </Paragraph>

          <Space size={16} wrap style={{ justifyContent: 'center', width: '100%' }}>
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
                    fontSize: 'clamp(14px, 2vw, 16px)',
                    fontWeight: 700,
                    borderRadius: 10,
                    background: '#2966A3',
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
                    fontSize: 'clamp(14px, 2vw, 16px)',
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
                    fontSize: 'clamp(14px, 2vw, 16px)',
                    fontWeight: 700,
                    borderRadius: 10,
                    background: '#2966A3',
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
                    fontSize: 'clamp(14px, 2vw, 16px)',
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
                  color: '#0B2641',
                }}
              >
                THE CORE PRODUCT VALUE LOOP
              </Text>
              <Title level={4} style={{ color: '#0B2641', margin: '4px 0 0' }}>
                "FROM IDENTIFYING COMPETENCY GAPS → TO PROVING COMPETENCY IMPROVEMENT"
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Click any step below to navigate directly into that stage of the framework.
              </Text>
            </div>

            <Row gutter={[16, 16]} align="stretch" justify="center">
              {[
                { title: '1. ROLE MAPPING', desc: 'FRAC Framework alignment (Role → Activities → Required Skills)', icon: <SafetyCertificateOutlined style={{ fontSize: 24, color: '#0B2641' }} />, route: '/profile' },
                { title: '2. EVIDENCE EXTRACT', desc: 'Quizzes + Work Artifact analysis (60/40 weighted formula)', icon: <FilePdfOutlined style={{ fontSize: 24, color: '#0B2641' }} />, route: '/upload-artifact' },
                { title: '3. GAP DIAGNOSTIC', desc: 'Calculates exact required vs current competency gap size', icon: <RiseOutlined style={{ fontSize: 24, color: '#B9842C' }} />, route: '/gaps' },
                { title: '4. iGOT LEARNING', desc: 'ChromaDB semantic search recommends targeted iGOT modules', icon: <BookOutlined style={{ fontSize: 24, color: '#0B2641' }} />, route: '/learning' },
                { title: '5. AI MCQ QUIZ', desc: 'LLM generates dynamic MCQs from uploaded course content', icon: <ThunderboltOutlined style={{ fontSize: 24, color: '#0B2641' }} />, route: '/quiz' },
                { title: '6. PASSPORT STAMP', desc: 'Records verified improvement delta in Officer Passport', icon: <CheckCircleOutlined style={{ fontSize: 24, color: '#3D7D70' }} />, route: '/passport' },
              ].map((step, idx) => (
                <Col xs={24} sm={12} md={8} lg={4} key={idx}>
                  <div
                    onClick={() => handleStepClick(step.route)}
                    style={{
                      background: '#F8FBFD',
                      padding: 16,
                      borderRadius: 10,
                      border: '1px solid #E8F0F7',
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
                      e.currentTarget.style.borderColor = '#0B2641';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(12,68,124,0.12)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = '#E8F0F7';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div>
                      <div style={{ marginBottom: 10 }}>{step.icon}</div>
                      <Text strong style={{ fontSize: 13, color: '#0B2641', display: 'block', marginBottom: 4 }}>
                        {step.title}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 11, lineHeight: 1.3, display: 'block' }}>
                        {step.desc}
                      </Text>
                    </div>
                    <Text style={{ fontSize: 10, color: '#2966A3', marginTop: 10, fontWeight: 600 }}>
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
      <div id="pillars" style={{ padding: 'clamp(40px, 7vw, 60px) clamp(16px, 4vw, 24px) 40px', maxWidth: 1140, margin: '0 auto', flex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Title level={3} style={{ color: '#0B2641', margin: 0 }}>
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
                borderTop: '4px solid #0B2641',
              }}
            >
              <SafetyCertificateOutlined style={{ fontSize: 32, color: '#0B2641', marginBottom: 16 }} />
              <Title level={4} style={{ color: '#0B2641', fontSize: 18 }}>
                Competency Passport
              </Title>
              <Paragraph style={{ color: '#465C70', fontSize: 13 }}>
                Maintains an immutable historical record of competency scores, evidence checkmarks, and growth trajectory line charts over time.
              </Paragraph>
              <Button type="link" style={{ padding: 0, color: '#0B2641', fontWeight: 600 }}>
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
                borderTop: '4px solid #0B2641',
              }}
            >
              <ThunderboltOutlined style={{ fontSize: 32, color: '#0B2641', marginBottom: 16 }} />
              <Title level={4} style={{ color: '#0B2641', fontSize: 18 }}>
                AI Quiz Generator
              </Title>
              <Paragraph style={{ color: '#465C70', fontSize: 13 }}>
                LangChain + Google Gemini integration automatically converts uploaded statistical guidelines and course documents into validated MCQs.
              </Paragraph>
              <Button type="link" style={{ padding: 0, color: '#0B2641', fontWeight: 600 }}>
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
                borderTop: '4px solid #0B2641',
              }}
            >
              <BarChartOutlined style={{ fontSize: 32, color: '#0B2641', marginBottom: 16 }} />
              <Title level={4} style={{ color: '#0B2641', fontSize: 18 }}>
                Training Intelligence
              </Title>
              <Paragraph style={{ color: '#465C70', fontSize: 13 }}>
                Provides MoSPI and NSSTA leadership with anonymized, org-wide gap distributions and pre-vs-post training effectiveness analytics.
              </Paragraph>
              <Button type="link" style={{ padding: 0, color: '#0B2641', fontWeight: 600 }}>
                View Admin Analytics →
              </Button>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Quick Demo Access Section for Hackathon Evaluators */}
      <div id="demo-profiles" style={{ background: '#F1F6FA', padding: 'clamp(40px, 7vw, 60px) clamp(16px, 4vw, 24px)', borderTop: '1px solid #D1E0EE' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <Tag color="blue" style={{ marginBottom: 8, fontSize: 12, padding: '2px 12px' }}>
              PROTOTYPE DEMO PORTAL
            </Tag>
            <Title level={3} style={{ color: '#0B2641', margin: 0 }}>
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
                color: '#2966A3',
              },
              {
                officer_id: 'OFF002',
                name: 'Sunita Verma',
                designation: 'Senior Statistical Officer (SSO)',
                department: 'Price Statistics Division',
                role: 'officer',
                badge: 'SSO Profile',
                desc: 'Focus: CPI/WPI Indexing, Data Verification, Economic Data',
                color: '#3D7D70',
              },
              {
                officer_id: 'OFF003',
                name: 'Arjun Nair',
                designation: 'ISS Officer - Director',
                department: 'Labour Statistics Division',
                role: 'officer',
                badge: 'ISS Officer',
                desc: 'Focus: Policy Evaluation, Sampling Design, Strategic Governance',
                color: '#6F79A8',
              },
              {
                officer_id: 'ADM001',
                name: 'Dr. Meena Agarwal',
                designation: 'Director — Training & Analytics',
                department: 'MoSPI / NSSTA Leadership',
                role: 'admin',
                badge: 'Admin & Leadership',
                desc: 'Focus: Org-wide Gap Intelligence, Training ROI & Effectiveness',
                color: '#A64A4A',
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

                    <Title level={5} style={{ margin: '0 0 2px', color: '#172B3D' }}>
                      {prof.name}
                    </Title>
                    <Text strong style={{ fontSize: 12, color: '#0B2641', display: 'block', marginBottom: 6 }}>
                      {prof.designation}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 12 }}>
                      {prof.department}
                    </Text>
                    <Paragraph style={{ fontSize: 12, color: '#72879A', lineHeight: 1.4 }}>
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
                      background: prof.role === 'admin' ? '#A64A4A' : '#0B2641',
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
      <div style={{ padding: 'clamp(40px, 7vw, 60px) clamp(16px, 4vw, 24px)', maxWidth: 1140, margin: '0 auto', width: '100%' }}>
        <Card
          bordered={false}
          style={{
            background: 'linear-gradient(135deg, #0B2641 0%, #1B4D7A 100%)',
            borderRadius: 14,
            padding: '36px 24px',
            color: '#fff',
            textAlign: 'center',
          }}
        >
          <Title level={3} style={{ color: '#ffffff', margin: '0 0 8px' }}>
            Ready to Explore STATKARMAYOG?
          </Title>
          <Paragraph style={{ color: '#E8F0F7', maxWidth: 640, margin: '0 auto 24px', fontSize: 15 }}>
            Experience the complete end-to-end competency development cycle for official statistics officers in India.
          </Paragraph>
          <Space size={16} wrap style={{ justifyContent: 'center' }}>
            <Button
              type="primary"
              size="large"
              icon={<ArrowRightOutlined />}
              onClick={() => navigate('/login')}
              style={{ background: '#2966A3', height: 48, padding: '0 32px', fontWeight: 700, borderRadius: 8 }}
            >
              Open Login Portal
            </Button>
          </Space>
        </Card>
      </div>

      {/* Footer */}
      <div style={{ background: '#172B3D', color: '#9AAEBD', padding: '28px clamp(16px, 4vw, 24px)', textAlign: 'center', fontSize: 12 }}>
        <Space size={24} style={{ marginBottom: 12 }}>
          <a onClick={() => navigate('/')} style={{ color: '#9AAEBD' }}>Home</a>
          <a onClick={() => navigate('/login')} style={{ color: '#9AAEBD' }}>Officer Login</a>
          <a onClick={() => handleStepClick('/gaps')} style={{ color: '#9AAEBD' }}>Gap Diagnostic</a>
          <a onClick={() => handleStepClick('/passport')} style={{ color: '#9AAEBD' }}>Competency Passport</a>
          <a onClick={() => handleStepClick('/quiz')} style={{ color: '#9AAEBD' }}>AI Quiz Generator</a>
        </Space>
        <div>
          StatKarmyog — Skill Intelligence & Competency Development Platform • Prototype for Smart India Hackathon 2026 (PS SIH26101)
        </div>
        <div style={{ marginTop: 4, color: '#72879A' }}>
          Ministry of Statistics and Programme Implementation (MoSPI) / National Statistical Systems Training Academy (NSSTA)
        </div>
      </div>
    </div>
  );
}

