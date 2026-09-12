/**
 * My Profile — Dynamic Officer Profile & FRAC Role Mapping from backend API.
 */

import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Typography, Tag, Space, Descriptions, Skeleton, Upload, Button, message, Alert, Empty } from 'antd';
import {
  SafetyCertificateOutlined,
  ArrowRightOutlined,
  CameraOutlined,
  CloseOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { getOfficerProfile, uploadProfilePhoto } from '../api/client';
import OfficerAvatar from '../components/OfficerAvatar';

const { Title, Text, Paragraph } = Typography;

const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function MyProfile() {
  const { user, setUser } = useAuth();
  const officerId = user?.officer_id || 'OFF001';

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      const res = await getOfficerProfile(officerId);
      setProfile(res.data);
      setLoadError(Boolean(res.error || !res.data));
      setLoading(false);
    }
    loadProfile();
  }, [officerId]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const beforePhotoSelect = (file) => {
    if (!PHOTO_TYPES.includes(file.type)) {
      message.error('Upload a JPG, PNG, or WEBP image.');
      return Upload.LIST_IGNORE;
    }
    if (file.size > PHOTO_MAX_BYTES) {
      message.error('Profile photo must be 5 MB or smaller.');
      return Upload.LIST_IGNORE;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedPhoto(file);
    setPreviewUrl(URL.createObjectURL(file));
    return false;
  };

  const cancelPhotoChange = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedPhoto(null);
    setPreviewUrl('');
  };

  const savePhoto = async () => {
    if (!selectedPhoto) return;
    setUploading(true);
    const res = await uploadProfilePhoto(officerId, selectedPhoto);
    setUploading(false);
    if (res.error || !res.data?.profile_photo_url) {
      message.error(res.message || 'Profile photo upload failed. Please try another image.');
      return;
    }
    const nextProfile = { ...profile, profile_photo_url: res.data.profile_photo_url };
    setProfile(nextProfile);
    setUser({
      ...user,
      profile_photo_url: res.data.profile_photo_url,
    });
    cancelPhotoChange();
    message.success('Profile photo updated successfully.');
  };

  if (loading) {
    return (
      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <Alert
          type="error"
          showIcon
          message="Officer profile could not be loaded"
          description="Please check that the backend is running and try again."
          style={{ marginBottom: 16 }}
        />
        <Card bordered={false} className="app-card">
          <Empty description="No officer profile data available" />
        </Card>
      </div>
    );
  }

  const name = profile.name;
  const currentSkills = profile?.current_skills || {};
  const skillEntries = Object.entries(currentSkills);
  const avatarOfficer = previewUrl ? { ...profile, profile_photo_url: previewUrl } : profile;

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, color: '#0C447C' }}>
          Officer Profile
        </Title>
        <Text type="secondary">
          Official Statistical System — Dynamic Profile & Role Competency Alignment
        </Text>
      </div>

      {/* Officer Bio Card */}
      <Card bordered={false} className="app-card" style={{ marginBottom: 24 }}>
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} md={6} style={{ textAlign: 'center' }}>
            <div className="profile-photo-frame">
              <OfficerAvatar officer={avatarOfficer} size={112} alt={`${name} profile photo`} />
              <Upload
                accept=".jpg,.jpeg,.png,.webp"
                showUploadList={false}
                beforeUpload={beforePhotoSelect}
                maxCount={1}
              >
                <Button
                  shape="circle"
                  icon={<CameraOutlined />}
                  aria-label="Change profile photo"
                  className="profile-photo-edit"
                />
              </Upload>
            </div>
            {selectedPhoto && (
              <Space size={8} style={{ marginBottom: 12 }}>
                <Button size="small" icon={<SaveOutlined />} type="primary" loading={uploading} onClick={savePhoto}>
                  Save
                </Button>
                <Button size="small" icon={<CloseOutlined />} disabled={uploading} onClick={cancelPhotoChange}>
                  Cancel
                </Button>
              </Space>
            )}
            <Title level={4} style={{ margin: 0 }}>
              {name}
            </Title>
            <Tag color="blue" style={{ marginTop: 6, fontWeight: 600 }}>
              {profile.designation}
            </Tag>
          </Col>

          <Col xs={24} md={18}>
            <Descriptions title="Officer Summary (Dynamic Backend Entity)" column={{ xs: 1, sm: 2, md: 3 }} bordered size="small">
              <Descriptions.Item label="Officer ID">{profile.officer_id || officerId}</Descriptions.Item>
              <Descriptions.Item label="Department">{profile.department}</Descriptions.Item>
              <Descriptions.Item label="Experience">{profile.experience_years} Years</Descriptions.Item>
              <Descriptions.Item label="Qualification">{profile.qualification}</Descriptions.Item>
              <Descriptions.Item label="Role ID">{profile.role_id}</Descriptions.Item>
              <Descriptions.Item label="Past Trainings">
                {(profile.past_trainings || []).length ? profile.past_trainings.join(', ') : 'No past trainings recorded'}
              </Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
      </Card>

      {/* FRAC Workflow: ROLE -> ACTIVITIES -> COMPETENCIES */}
      <Card
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#0C447C' }} />
            <span style={{ color: '#0C447C', fontWeight: 600 }}>FRAC Framework Alignment</span>
          </Space>
        }
        bordered={false}
        className="app-card"
      >
        <Row gutter={[24, 24]} align="stretch">
          <Col xs={24} md={8}>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 20, height: '100%' }}>
              <Tag color="navy" style={{ marginBottom: 12, background: '#0C447C', color: '#fff' }}>
                1. ASSIGNED ROLE
              </Tag>
              <Title level={4} style={{ color: '#0C447C', marginTop: 4 }}>
                {profile.designation}
              </Title>
              <Paragraph style={{ fontSize: 13, color: '#64748B' }}>
                Responsible for sampling design, statistical data collection, data quality validation, and reporting.
              </Paragraph>
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <ArrowRightOutlined style={{ fontSize: 24, color: '#0C447C' }} />
              </div>
            </div>
          </Col>

          <Col xs={24} md={8}>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 20, height: '100%' }}>
              <Tag color="blue" style={{ marginBottom: 12 }}>
                2. KEY ACTIVITIES
              </Tag>
              <ul style={{ paddingLeft: 18, margin: 0, fontSize: 13, color: '#334155' }}>
                <li style={{ marginBottom: 8 }}>Survey planning & questionnaire design</li>
                <li style={{ marginBottom: 8 }}>Field data collection & sampling selection</li>
                <li style={{ marginBottom: 8 }}>Statistical data quality audit & validation</li>
                <li style={{ marginBottom: 8 }}>Data reporting & metadata preparation</li>
              </ul>
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <ArrowRightOutlined style={{ fontSize: 24, color: '#0C447C' }} />
              </div>
            </div>
          </Col>

          <Col xs={24} md={8}>
            <div style={{ background: '#F0F7FF', border: '1px solid #BAE6FD', borderRadius: 8, padding: 20, height: '100%' }}>
              <Tag color="green" style={{ marginBottom: 12 }}>
                3. CURRENT COMPETENCY LEVELS
              </Tag>
              <Space direction="vertical" style={{ width: '100%' }} size={8}>
                {skillEntries.length ? skillEntries.map(([skill, lvl]) => (
                  <div key={skill} style={{ background: '#fff', padding: '6px 12px', borderRadius: 6, border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between' }}>
                    <Text strong style={{ fontSize: 13, color: '#0C447C' }}>{skill}</Text>
                    <Tag color="blue">Level {lvl} / 5</Tag>
                  </div>
                )) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No current skills recorded" />}
              </Space>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
