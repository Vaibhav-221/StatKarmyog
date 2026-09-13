/**
 * AppHeader — shared responsive top header / navbar component.
 *
 * Visual system:
 *   Navy       #0B2641
 *   Blue       #2966A3
 *   Mist Blue  #D1E0EE
 *   Soft White #F8FBFD
 *
 * Application logic, authentication handlers, routes, and quick-login
 * behavior are preserved. Only presentation and mobile navigation behavior
 * have been updated.
 */

import React, { useEffect, useState } from 'react';
import { Layout, Button, Typography, Space, Avatar, Dropdown, Drawer, Badge } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MenuOutlined,
  CloseOutlined,
  UserOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined,
  DashboardOutlined,
  LoginOutlined,
  DownOutlined,
  ArrowRightOutlined,
  HomeOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  BookOutlined,
  ThunderboltOutlined,
  RiseOutlined,
  BarChartOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { getOfficerProfile, MOCK_OFFICERS } from '../api/client';
import OfficerAvatar from './OfficerAvatar';

const { Header } = Layout;
const { Text } = Typography;

const COLORS = {
  navy: '#0B2641',
  blue: '#2966A3',
  mist: '#D1E0EE',
  softWhite: '#F8FBFD',
  text: '#172B3D',
  muted: '#617487',
  border: '#DCE7F0',
};

export default function AppHeader({
  collapsed,
  setCollapsed,
  showUser = true,
  isLanding = false,
}) {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      if (!user?.officer_id) {
        setProfile(null);
        return;
      }
      const res = await getOfficerProfile(user.officer_id);
      if (active) {
        setProfile(res.data || user);
      }
    }
    loadProfile();
    return () => {
      active = false;
    };
  }, [user?.officer_id, user?.profile_photo_url]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);

    if (location.pathname !== '/') {
      navigate('/#' + id);

      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleQuickLogin = (officerId) => {
    const officer =
      MOCK_OFFICERS.find((o) => o.officer_id === officerId) || MOCK_OFFICERS[0];

    setUser({
      officer_id: officer.officer_id,
      name: officer.name,
      designation: officer.designation,
      department: officer.department,
      role: officer.role || 'officer',
      profile_photo_url: officer.profile_photo_url || null,
    });

    setMobileMenuOpen(false);
    navigate(officer.role === 'admin' ? '/admin' : '/dashboard');
  };

  const quickLoginItems = MOCK_OFFICERS.map((o) => ({
    key: o.officer_id,
    label: (
      <div className="min-w-[200px] py-1">
        <Text strong className="block text-xs" style={{ color: COLORS.navy }}>
          {o.name}
        </Text>
        <Text type="secondary" className="text-[11px] block truncate">
          {o.designation}
        </Text>
      </div>
    ),
    onClick: () => handleQuickLogin(o.officer_id),
  }));

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  const isPublicView =
    isLanding || location.pathname === '/' || location.pathname === '/login';

  const landingNavItems = [
    { id: 'hero', label: 'Overview' },
    { id: 'value-loop', label: 'Value Loop' },
    { id: 'pillars', label: 'Pillars' },
    { id: 'demo-profiles', label: 'Demo Profiles' },
  ];

  const appNavLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: <DashboardOutlined /> },
    { path: '/profile', label: 'My Profile', icon: <UserOutlined /> },
    { path: '/competencies', label: 'My Competencies', icon: <CheckCircleOutlined /> },
    { path: '/gaps', label: 'Gap Analysis', icon: <RiseOutlined /> },
    { path: '/artifacts', label: 'Work Artifacts', icon: <FileTextOutlined /> },
    { path: '/upload-artifact', label: 'Upload Evidence', icon: <FileTextOutlined /> },
    { path: '/learning', label: 'Recommended Learning', icon: <BookOutlined /> },
    { path: '/igot', label: 'iGOT / NSSTA', icon: <BookOutlined /> },
    { path: '/quiz', label: 'AI Quiz & Re-assessment', icon: <ThunderboltOutlined /> },
    { path: '/passport', label: 'Competency Passport', icon: <SafetyCertificateOutlined /> },
    { path: '/progress', label: 'Progress & Reduction', icon: <RiseOutlined /> },
    ...(user?.role === 'admin'
      ? [{ path: '/admin', label: 'Admin (Training Intel)', icon: <BarChartOutlined /> }]
      : []),
  ];

  const brand = (
    <button
      type="button"
      onClick={() => navigate(user ? '/dashboard' : '/')}
      className="group flex min-w-0 items-center gap-2.5 rounded-lg text-left outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#2966A3] focus-visible:ring-offset-2"
      aria-label="Go to homepage"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D1E0EE] bg-[#F1F6FA] text-[#0B2641] transition-colors group-hover:bg-[#D1E0EE]">
        <SafetyCertificateOutlined className="text-[22px]" />
      </span>

      <span className="min-w-0">
        <span className="block truncate text-[18px] font-bold tracking-[-0.45px] text-[#0B2641] sm:text-[20px]">
          StatKarmyog
        </span>
        <span className="hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-[#617487] sm:block">
          Skill Intelligence Platform
        </span>
      </span>

      <span className="hidden rounded-full border border-[#D1E0EE] bg-[#F1F6FA] px-2 py-0.5 text-[10px] font-semibold text-[#2966A3] lg:inline-flex">
        MoSPI / NSSTA
      </span>
    </button>
  );

  const publicLandingLinks = (
    <nav aria-label="Landing page navigation" className="flex flex-col gap-1 md:flex-row md:items-center md:gap-1">
      {landingNavItems.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => scrollToSection(item.id)}
          className="rounded-lg px-3 py-2 text-left text-sm font-medium text-[#465C70] transition-colors hover:bg-[#F1F6FA] hover:text-[#0B2641] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2966A3] md:text-center"
        >
          {item.label}
        </button>
      ))}
    </nav>
  );

  const guestActions = (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Dropdown menu={{ items: quickLoginItems }} placement="bottomRight">
        <Button
          className="!h-10 !rounded-xl !border-[#D1E0EE] !bg-white !px-4 !text-sm !font-semibold !text-[#0B2641] hover:!border-[#2966A3] hover:!text-[#2966A3]"
        >
          <SwapOutlined className="text-[#2966A3]" /> Demo Quick Select <DownOutlined className="text-[10px]" />
        </Button>
      </Dropdown>

      <Button
        type="primary"
        icon={<LoginOutlined />}
        onClick={() => {
          setMobileMenuOpen(false);
          navigate('/login');
        }}
        className="!h-10 !rounded-xl !border-[#2966A3] !bg-[#2966A3] !px-5 !font-semibold shadow-sm hover:!border-[#0B2641] hover:!bg-[#0B2641]"
      >
        Officer Login
      </Button>
    </div>
  );

  const authenticatedActions = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {isPublicView && (
        <Button
          type="primary"
          icon={<DashboardOutlined />}
          onClick={() => {
            setMobileMenuOpen(false);
            navigate(user.role === 'admin' ? '/admin' : '/dashboard');
          }}
          className="!h-10 !rounded-xl !border-[#2966A3] !bg-[#2966A3] !font-semibold hover:!border-[#0B2641] hover:!bg-[#0B2641]"
        >
          Go to Dashboard
        </Button>
      )}

      {/* Switch Officer Dropdown */}
      <Dropdown menu={{ items: quickLoginItems }} placement="bottomRight">
        <Button
          size="middle"
          className="!hidden lg:!inline-flex !h-9 !rounded-lg !border-[#D1E0EE] !bg-white !px-3 !text-xs !font-medium !text-[#0B2641] hover:!border-[#2966A3]"
        >
          <SwapOutlined className="text-[#2966A3]" /> Switch Demo <DownOutlined className="text-[9px]" />
        </Button>
      </Dropdown>

      <div className="flex items-center gap-2.5 rounded-xl border border-[#DCE7F0] bg-white px-3 py-1.5 shadow-sm">
        <Avatar
          size={34}
          icon={<UserOutlined />}
          className="!bg-[#0B2641] !text-white !font-bold"
        >
          {initials}
        </Avatar>

        <div className="min-w-0 leading-tight">
          <Text strong className="block max-w-[150px] truncate text-xs !text-[#172B3D]">
            {user?.name || 'Officer'}
          </Text>
          <Text type="secondary" className="block max-w-[150px] truncate text-[10px] !text-[#617487]">
            {user?.designation || user?.department || ''}
          </Text>
        </div>

        <Button
          type="text"
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          title="Logout"
          aria-label="Logout"
          className="!text-[#617487] hover:!bg-[#F1F6FA] hover:!text-[#DC2626]"
        />
      </div>
    </div>
  );

  return (
    <>
      <Header
        className="sticky top-0 z-[99] !flex !h-[72px] !w-full !items-center !justify-between !border-b !border-[#DCE7F0] !bg-[#F8FBFD]/95 !px-4 shadow-[0_2px_14px_rgba(11,38,65,0.04)] backdrop-blur-md sm:!px-6 lg:!px-8"
      >
        <div className="flex min-w-0 items-center gap-3">
          {setCollapsed && (
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="!hidden md:!flex !h-10 !w-10 !shrink-0 !items-center !justify-center !rounded-xl !text-[#0B2641] hover:!bg-[#D1E0EE]"
            />
          )}

          {brand}

          {isPublicView && (
            <div className="ml-3 hidden lg:block">{publicLandingLinks}</div>
          )}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {showUser && (user ? authenticatedActions : guestActions)}
        </div>

        {/* Mobile Hamburger Button */}
        <Button
          type="text"
          icon={mobileMenuOpen ? <CloseOutlined /> : <MenuOutlined />}
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
          className="!flex !h-10 !w-10 !items-center !justify-center !rounded-xl !border !border-[#D1E0EE] !bg-white !text-[#0B2641] shadow-sm hover:!bg-[#D1E0EE] md:!hidden"
        />
      </Header>

      {/* Comprehensive Mobile Navigation Drawer */}
      <Drawer
        title={
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[#0B2641]">
              <SafetyCertificateOutlined className="text-xl text-[#2966A3]" />
              <span className="font-bold text-base tracking-tight">StatKarmyog</span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#2966A3] bg-[#D1E0EE]/50 px-2 py-0.5 rounded-full">
              SIH 2026
            </span>
          </div>
        }
        placement="right"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        width="min(90vw, 360px)"
        styles={{
          header: {
            borderBottom: `1px solid ${COLORS.border}`,
            background: COLORS.softWhite,
          },
          body: {
            background: COLORS.softWhite,
            padding: '16px',
          },
        }}
      >
        <div className="flex flex-col gap-5">
          {/* If Logged In: Officer Profile Summary in Drawer */}
          {user ? (
            <div className="rounded-2xl border border-[#DCE7F0] bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <Avatar size={44} icon={<UserOutlined />} className="!bg-[#0B2641] !text-white !font-bold">
                  {initials}
                </Avatar>
                <div className="min-w-0 flex-1">
                  <Text strong className="block truncate text-sm !text-[#0B2641]">
                    {user?.name || 'Officer'}
                  </Text>
                  <Text type="secondary" className="block truncate text-xs !text-[#617487]">
                    {user?.designation || user?.department || 'Official System'}
                  </Text>
                  <span className="inline-block mt-1 text-[10px] font-semibold text-[#2966A3] bg-[#D1E0EE]/60 px-2 py-0.5 rounded-md">
                    ID: {user?.officer_id}
                  </span>
                </div>
              </div>

              <div className="mt-3.5 pt-3 border-t border-[#E8F0F7] flex items-center justify-between">
                <Dropdown menu={{ items: quickLoginItems }} placement="bottomLeft">
                  <Button size="small" type="dashed" className="!rounded-lg !text-xs !text-[#0B2641]">
                    <SwapOutlined /> Switch Profile
                  </Button>
                </Dropdown>

                <Button
                  size="small"
                  danger
                  icon={<LogoutOutlined />}
                  onClick={handleLogout}
                  className="!rounded-lg !text-xs"
                >
                  Logout
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#DCE7F0] bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-[#0B2641] mb-2">Prototype Officer Access</p>
              {guestActions}
            </div>
          )}

          {/* Navigation Links inside Mobile Drawer */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#617487] px-1">
              {user ? 'Platform Features' : 'Navigation'}
            </p>

            {user ? (
              <div className="flex flex-col gap-1 max-h-[46vh] overflow-y-auto pr-1">
                {appNavLinks.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate(item.path);
                      }}
                      className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-[#2966A3] text-white shadow-sm font-semibold'
                          : 'text-[#172B3D] hover:bg-[#D1E0EE]/50 hover:text-[#0B2641]'
                      }`}
                    >
                      <span className={`text-base ${isActive ? 'text-white' : 'text-[#2966A3]'}`}>
                        {item.icon}
                      </span>
                      <span className="flex-1 truncate">{item.label}</span>
                      {isActive && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </button>
                  );
                })}

                <div className="pt-2 border-t border-[#DCE7F0] mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/');
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-xs font-medium text-[#617487] hover:bg-[#F1F6FA] hover:text-[#0B2641]"
                  >
                    <HomeOutlined />
                    <span>View Public Landing Page</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {publicLandingLinks}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-[#D1E0EE] bg-[#F1F6FA] p-3.5 text-center">
            <p className="text-xs font-bold text-[#0B2641]">
              MoSPI / NSSTA Platform
            </p>
            <p className="mt-1 text-[11px] leading-4 text-[#617487]">
              Smart India Hackathon 2026 • SIH26101
            </p>
          </div>
        </div>
      </Drawer>
    </>
  );
}

