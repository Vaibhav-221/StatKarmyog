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

import React, { useState } from 'react';
import { Layout, Button, Typography, Space, Avatar, Dropdown, Drawer } from 'antd';
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
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { MOCK_OFFICERS } from '../api/client';

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
    });

    setMobileMenuOpen(false);
    navigate(officer.role === 'admin' ? '/admin' : '/dashboard');
  };

  const quickLoginItems = MOCK_OFFICERS.map((o) => ({
    key: o.officer_id,
    label: (
      <div className="min-w-[190px] py-1">
        <Text strong className="block text-xs" style={{ color: COLORS.text }}>
          {o.name}
        </Text>
        <Text type="secondary" className="text-[11px]">
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

  const navItems = [
    { id: 'hero', label: 'Overview' },
    { id: 'value-loop', label: 'Value Loop' },
    { id: 'pillars', label: 'Pillars' },
    { id: 'demo-profiles', label: 'Demo Profiles' },
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
        Skill Intel
      </span>
    </button>
  );

  const navLinks = (
    <nav aria-label="Landing page navigation" className="flex flex-col gap-1 md:flex-row md:items-center md:gap-1">
      {navItems.map((item) => (
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
          className="!h-10 !rounded-lg !border-[#D1E0EE] !bg-white !px-4 !text-sm !font-medium !text-[#0B2641] hover:!border-[#2966A3] hover:!text-[#2966A3]"
        >
          Demo Quick Select <DownOutlined className="text-[10px]" />
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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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

      <div className="flex items-center gap-2.5">
        <Avatar
          size={36}
          icon={<UserOutlined />}
          className="!bg-[#0B2641] !text-white"
        >
          {initials}
        </Avatar>

        <div className="min-w-0 leading-tight">
          <Text strong className="block max-w-[160px] truncate text-xs !text-[#172B3D]">
            {user?.name || 'Officer'}
          </Text>
          <Text type="secondary" className="block max-w-[160px] truncate text-[10px]">
            {user?.designation || user?.department || ''}
          </Text>
        </div>

        <Button
          type="text"
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          title="Logout"
          aria-label="Logout"
          className="!text-[#617487] hover:!bg-[#F1F6FA] hover:!text-[#0B2641]"
        />
      </div>
    </div>
  );

  return (
    <>
      <Header
        className="sticky top-0 z-[99] !flex !h-[72px] !w-full !items-center !justify-between !border-b !border-[#DCE7F0] !bg-[#F8FBFD]/95 !px-4 shadow-[0_2px_14px_rgba(11,38,65,0.06)] backdrop-blur-md sm:!px-6 lg:!px-8"
      >
        <div className="flex min-w-0 items-center gap-3">
          {setCollapsed && (
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="!flex !h-10 !w-10 !shrink-0 !items-center !justify-center !rounded-lg !text-[#0B2641] hover:!bg-[#D1E0EE]"
            />
          )}

          {brand}

          {isPublicView && (
            <div className="ml-3 hidden lg:block">{navLinks}</div>
          )}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {showUser && (user ? authenticatedActions : guestActions)}
        </div>

        <Button
          type="text"
          icon={mobileMenuOpen ? <CloseOutlined /> : <MenuOutlined />}
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
          className="!flex !h-10 !w-10 !items-center !justify-center !rounded-lg !text-[#0B2641] hover:!bg-[#D1E0EE] md:!hidden"
        />
      </Header>

      <Drawer
        title={
          <div className="flex items-center gap-2 text-[#0B2641]">
            <SafetyCertificateOutlined />
            <span className="font-semibold">StatKarmyog</span>
          </div>
        }
        placement="right"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        width="min(88vw, 360px)"
        styles={{
          header: {
            borderBottom: `1px solid ${COLORS.border}`,
            background: COLORS.softWhite,
          },
          body: {
            background: COLORS.softWhite,
            padding: 20,
          },
        }}
      >
        <div className="flex flex-col gap-6">
          {isPublicView && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#617487]">
                Navigation
              </p>
              {navLinks}
            </div>
          )}

          {showUser && (
            <div className="border-t border-[#DCE7F0] pt-5">
              {user ? authenticatedActions : guestActions}
            </div>
          )}

          <div className="rounded-xl border border-[#D1E0EE] bg-[#F1F6FA] p-4">
            <p className="text-xs font-semibold text-[#0B2641]">
              Official Statistical System
            </p>
            <p className="mt-1 text-xs leading-5 text-[#617487]">
              AI-enabled competency intelligence for measurable professional growth.
            </p>
          </div>
        </div>
      </Drawer>
    </>
  );
}
