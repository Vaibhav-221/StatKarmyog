/**
 * AppHeader — shared responsive top header / navbar component.
 *
 * Uses the unified navigation configuration to render the desktop header controls
 * and the shared MobileNavDrawer component.
 */

import React, { useEffect, useState } from 'react';
import { Layout, Button, Typography, Dropdown, Modal } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MenuOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined,
  DashboardOutlined,
  LoginOutlined,
  DownOutlined,
  SwapOutlined,
  GithubOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { getOfficerProfile, MOCK_OFFICERS } from '../api/client';
import MobileNavDrawer from './MobileNavDrawer';
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

const GITHUB_REPO_URL = 'https://github.com/buddhu22/StatKarmyog';

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
    Modal.confirm({
      title: 'Are you sure you want to sign out?',
      content: 'You will need to sign in again to access your workspace.',
      okText: 'Yes, sign out',
      cancelText: 'No',
      okButtonProps: {
        danger: true,
      },
      onOk: () => {
        logout();
        setMobileMenuOpen(false);
        navigate('/login');
      },
    });
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


  const isPublicView =
    isLanding || location.pathname === '/' || location.pathname === '/login';

  const landingNavItems = [
    { id: 'hero', label: 'Overview' },
    { id: 'value-loop', label: 'Value Loop' },
    { id: 'pillars', label: 'Pillars' },
    { id: 'demo-profiles', label: 'Demo Profiles' },
  ];

  const workspaceTitle = user?.role === 'admin' ? 'Admin Workspace' : 'Officer Workspace';
  const headerOfficer = user ? { ...profile, ...user } : null;

  const brand = (
    <button
      type="button"
      onClick={() => navigate(user ? '/dashboard' : '/')}
      className="group flex min-w-0 items-center gap-2.5 rounded-lg text-left outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#2966A3] focus-visible:ring-offset-2"
      aria-label="Go to homepage"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#D1E0EE] bg-[#F1F6FA] text-[#0B2641] transition-colors group-hover:bg-[#D1E0EE]">
        <SafetyCertificateOutlined className="text-[22px]" />
      </span>

      <span className="min-w-0">
        <span className="block truncate text-[18px] font-bold tracking-normal text-[#0B2641] sm:text-[20px]">
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
          className="!h-10 !rounded-lg !border-[#D1E0EE] !bg-white !px-4 !text-sm !font-semibold !text-[#0B2641] hover:!border-[#2966A3] hover:!text-[#2966A3]"
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
        className="!h-10 !rounded-lg !border-[#2966A3] !bg-[#2966A3] !px-5 !font-semibold shadow-sm hover:!border-[#0B2641] hover:!bg-[#0B2641]"
      >
        Officer Login
      </Button>
    </div>
  );

  const authenticatedActions = (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
      {isPublicView && (
        <Button
          type="primary"
          icon={<DashboardOutlined />}
          onClick={() => {
            setMobileMenuOpen(false);
            navigate(user.role === 'admin' ? '/admin' : '/dashboard');
          }}
          className="!h-10 !rounded-lg !border-[#2966A3] !bg-[#2966A3] !font-semibold hover:!border-[#0B2641] hover:!bg-[#0B2641]"
        >
          Go to Dashboard
        </Button>
      )}

      {/* Switch Officer Dropdown */}
      <Dropdown menu={{ items: quickLoginItems }} placement="bottomRight">
        <Button
          size="middle"
          className="!hidden lg:!inline-flex !h-10 !items-center !rounded-lg !border-[#D1E0EE] !bg-white !px-3 !text-xs !font-semibold !text-[#0B2641] hover:!border-[#2966A3] hover:!text-[#2966A3]"
        >
          <SwapOutlined className="text-[#2966A3]" /> Switch Demo <DownOutlined className="text-[9px]" />
        </Button>
      </Dropdown>

      <div className="flex h-12 items-center gap-3 rounded-lg border border-[#DCE7F0] bg-white px-3 shadow-sm">
        <OfficerAvatar officer={headerOfficer} size={32} />

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
          title="Sign out"
          aria-label="Sign out"
          className="!h-8 !w-8 !rounded-lg !border !border-[#E8C7C7] !bg-[#FFF7F7] !text-[#A64A4A] hover:!border-[#A64A4A] hover:!bg-[#FCECEC] hover:!text-[#8F3737]"
        />
      </div>
    </div>
  );

  return (
    <>
      <Header
        className="sticky top-0 z-[99] !flex !h-[72px] !w-full !items-center !justify-between !border-b !border-[#DCE7F0] !bg-white/95 !px-4 shadow-[0_2px_14px_rgba(11,38,65,0.04)] backdrop-blur-md sm:!px-6 lg:!px-8"
      >
        <div className="flex min-w-0 items-center gap-3">
          {setCollapsed && (
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="!hidden md:!flex !h-10 !w-10 !shrink-0 !items-center !justify-center !rounded-lg !text-[#0B2641] hover:!bg-[#D1E0EE]"
            />
          )}

          {setCollapsed ? (
            <>
              <div className="md:hidden">{brand}</div>
              <div className="hidden min-w-0 flex-col md:flex">
                <Text strong className="block truncate text-[15px] !text-[#0B2641]">
                  {workspaceTitle}
                </Text>
                <Text className="block truncate text-[11px] font-medium !text-[#617487]">
                  StatKarmyog Skill Intelligence Platform
                </Text>
              </div>
            </>
          ) : (
            brand
          )}

          {isPublicView && (
            <div className="ml-3 hidden lg:block">{publicLandingLinks}</div>
          )}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Button
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noreferrer"
            icon={<GithubOutlined />}
            className="!inline-flex !h-10 !items-center !rounded-lg !border-[#DCE7F0] !bg-[#F8FBFD] !px-3 !text-xs !font-semibold !text-[#0B2641] hover:!border-[#2966A3] hover:!bg-[#EFF7FC] hover:!text-[#2966A3]"
          >
            GitHub
          </Button>
          {showUser && (user ? authenticatedActions : guestActions)}
        </div>

        {/* Mobile Hamburger Button */}
        <Button
          type="text"
          icon={<MenuOutlined />}
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open mobile navigation menu"
          aria-expanded={mobileMenuOpen}
          className="!flex !h-10 !w-10 !items-center !justify-center !rounded-lg !border !border-[#D1E0EE] !bg-white !text-[#0B2641] shadow-sm hover:!bg-[#D1E0EE] md:!hidden"
        />
      </Header>

      {/* Unified Mobile Navigation Drawer */}
      <MobileNavDrawer
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        user={user}
        quickLoginItems={quickLoginItems}
        handleLogout={handleLogout}
      />
    </>
  );
}
