/**
 * AppShell — Main layout wrapper with complete sidebar navigation hierarchy.
 *
 * Implements unified navigation hierarchy for STATKARMAYOG on desktop (collapsible Sider)
 * and mobile/tablet (using shared navigation configuration and drawer).
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import { SafetyCertificateOutlined } from '@ant-design/icons';
import AppHeader from './AppHeader';
import { useAuth } from '../context/AuthContext';
import {
  getAuthorizedNavItems,
  buildAntdMenuItems,
  getActiveParentKeys,
} from '../config/navigationConfig';

const { Sider, Content } = Layout;

export default function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setCollapsed(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter items based on user authorization
  const navItems = useMemo(() => getAuthorizedNavItems(user), [user?.role]);
  const antdMenuItems = useMemo(() => buildAntdMenuItems(navItems), [navItems]);

  // Derive active menu keys and open submenu keys based on current URL path
  const activeKeys = useMemo(() => [location.pathname], [location.pathname]);
  
  // Calculate active parent keys purely from current pathname
  const activeParentKeys = useMemo(
    () => getActiveParentKeys(navItems, location.pathname),
    [navItems, location.pathname]
  );

  const [openKeys, setOpenKeys] = useState(() => getActiveParentKeys(navItems, location.pathname));

  // Sync open keys only when activeParentKeys change without cascading setState
  useEffect(() => {
    if (activeParentKeys.length > 0) {
      setOpenKeys((prev) => {
        const needsUpdate = activeParentKeys.some((k) => !prev.includes(k));
        if (!needsUpdate) return prev;
        const combined = new Set([...prev, ...activeParentKeys]);
        return Array.from(combined);
      });
    }
  }, [activeParentKeys]);

  const handleMenuClick = ({ key }) => {
    if (key && !key.includes('_group')) {
      navigate(key);
    }
  };

  const renderBrandHeader = () => (
    <div
      style={{
        height: 72,
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        padding: collapsed ? '0' : '0 20px',
        borderBottom: '1px solid rgba(209, 224, 238, 0.12)',
        cursor: 'pointer',
        background: '#0B2641',
      }}
      onClick={() => navigate('/dashboard')}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 text-[#D1E0EE]">
        <SafetyCertificateOutlined className="text-xl" />
      </div>
      {!collapsed && (
        <div style={{ marginLeft: 12, lineHeight: 1.2 }}>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, letterSpacing: '0' }}>
            STATKARMAYOG
          </div>
          <div style={{ color: '#D1E0EE', fontSize: 10, fontWeight: 500, letterSpacing: '0.05em' }}>
            Skill Intelligence
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Layout style={{ minHeight: '100vh', background: '#F8FBFD' }}>
      {/* Desktop Sider */}
      {!isMobile && (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={250}
          collapsedWidth={76}
          style={{
            overflow: 'auto',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 100,
            background: '#0B2641',
            boxShadow: '4px 0 20px rgba(11, 38, 65, 0.08)',
          }}
        >
          {renderBrandHeader()}
          <div style={{ padding: '8px 10px' }}>
            <Menu
              theme="dark"
              mode="inline"
              selectedKeys={activeKeys}
              openKeys={collapsed ? [] : openKeys}
              onOpenChange={setOpenKeys}
              items={antdMenuItems}
              onClick={handleMenuClick}
              style={{ background: 'transparent', border: 'none' }}
            />
          </div>
        </Sider>
      )}

      {/* Main Content Layout */}
      <Layout
        style={{
          marginLeft: isMobile ? 0 : collapsed ? 76 : 250,
          transition: 'margin-left 0.2s ease',
          minHeight: '100vh',
          background: '#F8FBFD',
        }}
      >
        <AppHeader
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          showUser={true}
        />

        <Content style={{ overflow: 'auto', minHeight: 'calc(100vh - 72px)', background: '#F8FBFD' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
