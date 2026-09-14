/**
 * navigationConfig.jsx — Single Source of Truth for Platform Navigation.
 *
 * Defines the complete navigation hierarchy, parent-child structures, routes,
 * icons, labels, permissions, and helper methods for active-state calculation
 * and automatic parent expansion.
 */

import React from 'react';
import {
  HomeOutlined,
  DashboardOutlined,
  UserOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  BookOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined,
  RiseOutlined,
  BarChartOutlined,
} from '@ant-design/icons';

export const NAVIGATION_CONFIG = [
  {
    key: '/',
    path: '/',
    label: 'Portal Overview',
    icon: <HomeOutlined />,
    exact: true,
    public: true,
  },
  {
    key: '/dashboard',
    path: '/dashboard',
    label: 'Dashboard',
    icon: <DashboardOutlined />,
  },
  {
    key: '/profile',
    path: '/profile',
    label: 'My Profile',
    icon: <UserOutlined />,
  },
  {
    key: 'competency_group',
    label: 'Competency',
    icon: <CheckCircleOutlined />,
    children: [
      {
        key: '/competencies',
        path: '/competencies',
        label: 'My Competencies',
      },
      {
        key: '/gaps',
        path: '/gaps',
        label: 'Gap Analysis',
      },
    ],
  },
  {
    key: 'evidence_group',
    label: 'Work Evidence',
    icon: <FileTextOutlined />,
    children: [
      {
        key: '/artifacts',
        path: '/artifacts',
        label: 'Work Artifacts',
      },
      {
        key: '/upload-artifact',
        path: '/upload-artifact',
        label: 'Upload Artifact',
      },
      {
        key: '/evidence-history',
        path: '/evidence-history',
        label: 'Evidence History',
      },
    ],
  },
  {
    key: 'learning_group',
    label: 'Learning',
    icon: <BookOutlined />,
    children: [
      {
        key: '/learning',
        path: '/learning',
        label: 'Recommended Learning',
      },
      {
        key: '/igot',
        path: '/igot',
        label: 'iGOT / NSSTA',
      },
    ],
  },
  {
    key: 'ai_quiz_group',
    label: 'AI Quiz',
    icon: <ThunderboltOutlined />,
    children: [
      {
        key: '/quiz',
        path: '/quiz',
        label: 'Generate Quiz',
      },
      {
        key: '/my-quizzes',
        path: '/my-quizzes',
        label: 'My Quizzes',
      },
    ],
  },
  {
    key: '/passport',
    path: '/passport',
    label: 'Competency Passport',
    icon: <SafetyCertificateOutlined />,
  },
  {
    key: '/progress',
    path: '/progress',
    label: 'Progress',
    icon: <RiseOutlined />,
  },
  {
    key: '/admin',
    path: '/admin',
    label: 'Admin View',
    icon: <BarChartOutlined />,
    adminOnly: true,
  },
];

const ADMIN_NAV_KEYS = new Set(['/admin', '/profile', 'learning_group']);

/**
 * Filter navigation items based on current user role/permissions.
 */
export function getAuthorizedNavItems(user) {
  if (!user) {
    return NAVIGATION_CONFIG.filter((item) => Boolean(item.public));
  }

  if (user?.role === 'admin') {
    return NAVIGATION_CONFIG.filter((item) => ADMIN_NAV_KEYS.has(item.key));
  }

  return NAVIGATION_CONFIG.filter((item) => {
    return !item.adminOnly && !item.public;
  });
}

/**
 * Determine if a specific item or any of its children match the current pathname.
 */
export function isNavItemActive(item, currentPath) {
  if (item.path) {
    if (item.exact) {
      return currentPath === item.path;
    }
    return currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));
  }
  if (item.children) {
    return item.children.some((child) => isNavItemActive(child, currentPath));
  }
  return false;
}

/**
 * Get all parent keys whose children include the current pathname.
 */
export function getActiveParentKeys(navItems, currentPath) {
  const activeParents = [];
  for (const item of navItems) {
    if (item.children) {
      const hasActiveChild = item.children.some((child) => isNavItemActive(child, currentPath));
      if (hasActiveChild) {
        activeParents.push(item.key);
      }
    }
  }
  return activeParents;
}

/**
 * Transform our shared config to Ant Design Menu items format for Desktop Sider.
 */
export function buildAntdMenuItems(navItems) {
  return navItems.map((item) => {
    if (item.children) {
      return {
        key: item.key,
        icon: item.icon,
        label: item.label,
        children: item.children.map((child) => ({
          key: child.path || child.key,
          label: child.label,
        })),
      };
    }
    return {
      key: item.path || item.key,
      icon: item.icon,
      label: item.label,
    };
  });
}

