import React from 'react';
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { buildAssetUrl } from '../api/client';

export function getInitials(name = '') {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return initials || 'U';
}

export default function OfficerAvatar({ officer, size = 40, alt, style }) {
  const src = buildAssetUrl(officer?.profile_photo_url);
  const name = officer?.name || 'Officer';
  return (
    <Avatar
      src={src || undefined}
      icon={!src ? <UserOutlined /> : undefined}
      size={size}
      alt={alt || `${name} profile photo`}
      style={{
        backgroundColor: '#0C447C',
        backgroundColor: '#0B2641',
        color: '#fff',
        fontWeight: 700,
        flex: '0 0 auto',
        ...style,
      }}
    >
      {!src ? getInitials(name) : null}
    </Avatar>
  );
}
