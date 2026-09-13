/**
 * MobileNavDrawer — Accessible, hierarchical mobile navigation drawer.
 *
 * Renders the unified navigation hierarchy on mobile devices using the shared
 * navigation configuration. Parent items render as accessible, expandable
 * disclosure buttons with chevron indicators. Child items render indented directly
 * beneath parent items. Automatically expands active parent sections and
 * closes the drawer upon child route navigation.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Drawer, Typography, Button, Dropdown } from 'antd';
import {
  SafetyCertificateOutlined,
  SwapOutlined,
  LogoutOutlined,
  LoginOutlined,
  RightOutlined,
  GithubOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  getAuthorizedNavItems,
  isNavItemActive,
  getActiveParentKeys,
} from '../config/navigationConfig';
import OfficerAvatar from './OfficerAvatar';

const { Text } = Typography;
const GITHUB_REPO_URL = 'https://github.com/buddhu22/StatKarmyog';

export default function MobileNavDrawer({
  open,
  onClose,
  user,
  quickLoginItems,
  handleLogout,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = useMemo(() => getAuthorizedNavItems(user), [user?.role]);

  // Derive active parent keys from current path
  const activeParentKeys = useMemo(
    () => getActiveParentKeys(navItems, currentPath),
    [navItems, currentPath]
  );

  // State to track expanded parent section keys
  const [expandedKeys, setExpandedKeys] = useState(() => {
    const initial = {};
    activeParentKeys.forEach((key) => {
      initial[key] = true;
    });
    return initial;
  });

  // Automatically expand parent sections when active child route changes
  useEffect(() => {
    if (activeParentKeys.length > 0) {
      setExpandedKeys((prev) => {
        const needsUpdate = activeParentKeys.some((k) => !prev[k]);
        if (!needsUpdate) return prev;
        const next = { ...prev };
        activeParentKeys.forEach((key) => {
          next[key] = true;
        });
        return next;
      });
    }
  }, [activeParentKeys]);

  const toggleParent = (key) => {
    setExpandedKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleNavigate = (path) => {
    if (path) {
      navigate(path);
      onClose();
    }
  };


  return (
    <Drawer
      title={
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 text-[#0B2641]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0B2641] text-white">
              <SafetyCertificateOutlined className="text-base" />
            </div>
            <span className="font-bold text-base tracking-normal">StatKarmyog</span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#2966A3] bg-[#D1E0EE]/60 px-2.5 py-0.5 rounded-full">
            MoSPI
          </span>
        </div>
      }
      placement="right"
      open={open}
      onClose={onClose}
      width="min(88vw, 340px)"
      styles={{
        header: {
          borderBottom: '1px solid #DCE7F0',
          background: '#F8FBFD',
          padding: '16px',
        },
        body: {
          background: '#F8FBFD',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        },
      }}
    >
      <div className="flex flex-col gap-4 overflow-y-auto pr-0.5">
        {/* Officer Profile Summary if authenticated */}
        {user && (
          <div className="rounded-lg border border-[#DCE7F0] bg-white p-3.5 shadow-sm">
            <div className="flex items-center gap-3">
              <OfficerAvatar officer={user} size={40} />
              <div className="min-w-0 flex-1">
                <Text strong className="block truncate text-xs !text-[#0B2641]">
                  {user?.name || 'Officer'}
                </Text>
                <Text type="secondary" className="block truncate text-[11px] !text-[#617487]">
                  {user?.designation || user?.department || 'Official System'}
                </Text>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-[#E8F0F7] flex items-center justify-between">
              {quickLoginItems && (
                <Dropdown menu={{ items: quickLoginItems }} placement="bottomLeft">
                  <Button size="small" type="dashed" className="!rounded-lg !text-[11px] !text-[#0B2641]">
                    <SwapOutlined /> Switch Demo
                  </Button>
                </Dropdown>
              )}

              {handleLogout && (
                <Button
                  size="small"
                  danger
                  icon={<LogoutOutlined />}
                  onClick={handleLogout}
                  className="!rounded-lg !border-[#E8C7C7] !bg-[#FFF7F7] !text-[11px] !text-[#A64A4A] hover:!border-[#A64A4A] hover:!bg-[#FCECEC] hover:!text-[#8F3737]"
                >
                  Sign out
                </Button>
              )}
            </div>
          </div>
        )}

        {!user && (
          <div className="rounded-lg border border-[#DCE7F0] bg-white p-3 shadow-sm">
            <Text strong className="block text-sm !text-[#0B2641]">
              Guest Access
            </Text>
            <Text type="secondary" className="mt-0.5 block text-[11px] !text-[#617487]">
              Sign in to open your dashboard tools.
            </Text>

            <div className="mt-3 flex flex-col gap-2">
              {quickLoginItems && (
                <Dropdown menu={{ items: quickLoginItems }} placement="bottomLeft">
                  <Button className="!h-10 !w-full !justify-start !rounded-lg !border-[#D1E0EE] !text-[#0B2641]">
                    <SwapOutlined className="text-[#2966A3]" /> Demo Quick Select
                  </Button>
                </Dropdown>
              )}

              <Button
                type="primary"
                icon={<LoginOutlined />}
                onClick={() => handleNavigate('/login')}
                className="!h-10 !w-full !rounded-lg !border-[#2966A3] !bg-[#2966A3] !font-semibold hover:!border-[#0B2641] hover:!bg-[#0B2641]"
              >
                Officer Login
              </Button>
            </div>
          </div>
        )}

        {/* Hierarchical Navigation Tree */}
        <nav aria-label="Mobile platform navigation" className="space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#617487] px-2 mb-2">
            Navigation Menu
          </div>

          {navItems.map((item) => {
            const hasChildren = Boolean(item.children && item.children.length > 0);
            const isExpanded = Boolean(expandedKeys[item.key]);
            const isItemActive = isNavItemActive(item, currentPath);

            if (hasChildren) {
              const panelId = `mobile-nav-panel-${item.key}`;
              const buttonId = `mobile-nav-btn-${item.key}`;

              return (
                <div key={item.key} className="space-y-1">
                  {/* Parent expandable button */}
                  <button
                    id={buttonId}
                    type="button"
                    onClick={() => toggleParent(item.key)}
                    aria-expanded={isExpanded}
                    aria-controls={panelId}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-semibold transition-all ${
                      isItemActive
                        ? 'bg-[#D1E0EE]/70 text-[#0B2641]'
                        : 'text-[#172B3D] hover:bg-[#D1E0EE]/40 hover:text-[#0B2641]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span className={`text-sm ${isItemActive ? 'text-[#2966A3]' : 'text-[#617487]'}`}>
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </span>
                    <RightOutlined
                      className={`text-[10px] text-[#617487] transition-transform duration-200 ${
                        isExpanded ? 'rotate-90 text-[#2966A3]' : ''
                      }`}
                    />
                  </button>

                  {/* Indented child items */}
                  {isExpanded && (
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      className="ml-3 pl-3 border-l-2 border-[#DCE7F0] space-y-1 my-1"
                    >
                      {item.children.map((child) => {
                        const isChildActive = currentPath === child.path;
                        return (
                          <button
                            key={child.key || child.path}
                            type="button"
                            onClick={() => handleNavigate(child.path)}
                            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-all ${
                              isChildActive
                                ? 'bg-[#2966A3] font-semibold text-white shadow-xs'
                                : 'text-[#465C70] hover:bg-[#D1E0EE]/50 hover:text-[#0B2641] font-medium'
                            }`}
                          >
                            <span className="truncate">{child.label}</span>
                            {isChildActive && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // Top-level direct link
            const isDirectActive = isNavItemActive(item, currentPath);
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleNavigate(item.path)}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-semibold transition-all ${
                  isDirectActive
                    ? 'bg-[#2966A3] text-white shadow-xs'
                    : 'text-[#172B3D] hover:bg-[#D1E0EE]/40 hover:text-[#0B2641]'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <span className={`text-sm ${isDirectActive ? 'text-white' : 'text-[#617487]'}`}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </span>
                {isDirectActive && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </button>
            );
          })}
        </nav>

        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#BFD7E8] bg-white px-3 py-2.5 text-xs font-semibold text-[#0B2641] shadow-sm transition-colors hover:border-[#2966A3] hover:bg-[#EFF7FC] hover:text-[#2966A3]"
        >
          <GithubOutlined className="text-base" />
          View project on GitHub
        </a>
      </div>

      <div className="pt-4 border-t border-[#DCE7F0] mt-4 text-center">
        <p className="text-[11px] font-semibold text-[#0B2641] m-0">
          StatKarmyog / MoSPI
        </p>
        <p className="text-[10px] text-[#617487] mt-0.5 mb-0">
          Skill Intelligence &amp; FRAC Framework
        </p>
      </div>
    </Drawer>
  );
}
