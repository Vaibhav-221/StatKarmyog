/**
 * My Profile — Dynamic Officer Profile & FRAC Role Mapping from backend API.
 */

import React, { useEffect, useState } from 'react';
import { Typography, Tag, Descriptions, Skeleton, Upload, Button, message, Alert, Empty } from 'antd';
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

const { Text } = Typography;

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
      <div className="w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-4">
        <Alert
          type="error"
          showIcon
          message="Officer profile could not be loaded"
          description="Please check that the backend is running and try again."
          className="!rounded-xl"
        />
        <div className="rounded-2xl border border-[#DCE7F0] bg-white p-6 shadow-sm">
          <Empty description="No officer profile data available" />
        </div>
      </div>
    );
  }

  const name = profile.name;
  const currentSkills = profile?.current_skills || {};
  const skillEntries = Object.entries(currentSkills);
  const avatarOfficer = previewUrl ? { ...profile, profile_photo_url: previewUrl } : profile;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0B2641] m-0">
          Officer Profile
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-[#617487]">
          Official Statistical System — Dynamic Profile &amp; FRAC Competency Alignment
        </p>
      </div>

      {/* Officer Bio Card */}
      <div className="rounded-2xl border border-[#DCE7F0] bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Avatar + Photo Upload */}
          <div className="md:col-span-4 lg:col-span-3 flex flex-col items-center text-center">
            <div className="relative mb-3 inline-block">
              <OfficerAvatar officer={avatarOfficer} size={110} alt={`${name} profile photo`} />
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
                  className="!absolute !bottom-0 !right-0 !bg-[#2966A3] !text-white !border-2 !border-white shadow-md hover:!bg-[#0B2641]"
                />
              </Upload>
            </div>

            {selectedPhoto && (
              <div className="flex gap-2 mb-3">
                <Button
                  size="small"
                  icon={<SaveOutlined />}
                  type="primary"
                  loading={uploading}
                  onClick={savePhoto}
                  className="!bg-[#2966A3]"
                >
                  Save Photo
                </Button>
                <Button size="small" icon={<CloseOutlined />} disabled={uploading} onClick={cancelPhotoChange}>
                  Cancel
                </Button>
              </div>
            )}

            <h3 className="text-lg font-bold text-[#0B2641] m-0">{name}</h3>
            <span className="mt-1 inline-block rounded-full bg-[#D1E0EE]/70 px-3 py-0.5 text-xs font-semibold text-[#2966A3]">
              {profile.designation}
            </span>
          </div>

          {/* Officer Details */}
          <div className="md:col-span-8 lg:col-span-9">
            <Descriptions
              title={<span className="text-sm font-bold text-[#0B2641]">Officer System Credentials</span>}
              column={{ xs: 1, sm: 2, md: 3 }}
              bordered
              size="small"
            >
              <Descriptions.Item label="Officer ID">
                <span className="font-semibold text-[#0B2641]">{profile.officer_id || officerId}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Department">{profile.department}</Descriptions.Item>
              <Descriptions.Item label="Experience">{profile.experience_years} Years</Descriptions.Item>
              <Descriptions.Item label="Qualification">{profile.qualification}</Descriptions.Item>
              <Descriptions.Item label="Role ID">{profile.role_id}</Descriptions.Item>
              <Descriptions.Item label="Past Trainings">
                {(profile.past_trainings || []).length
                  ? profile.past_trainings.join(', ')
                  : 'No past trainings recorded'}
              </Descriptions.Item>
            </Descriptions>
          </div>
        </div>
      </div>

      {/* FRAC Framework Section */}
      <div className="rounded-2xl border border-[#DCE7F0] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5 pb-3 border-b border-[#DCE7F0]">
          <SafetyCertificateOutlined className="text-lg text-[#2966A3]" />
          <h3 className="text-base font-bold text-[#0B2641] m-0">FRAC Framework Alignment</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Column 1: Role */}
          <div className="rounded-xl border border-[#DCE7F0] bg-[#F8FBFD] p-5">
            <span className="inline-block text-[11px] font-bold uppercase tracking-wider bg-[#0B2641] text-white px-2.5 py-0.5 rounded-md mb-3">
              1. ASSIGNED ROLE
            </span>
            <h4 className="text-base font-bold text-[#0B2641] m-0">{profile.designation}</h4>
            <p className="mt-2 text-xs text-[#617487] leading-relaxed">
              Responsible for sampling design, statistical data collection, data quality validation, and reporting.
            </p>
            <div className="text-center mt-4">
              <ArrowRightOutlined className="text-lg text-[#2966A3]" />
            </div>
          </div>

          {/* Column 2: Activities */}
          <div className="rounded-xl border border-[#DCE7F0] bg-[#F8FBFD] p-5">
            <span className="inline-block text-[11px] font-bold uppercase tracking-wider bg-[#2966A3] text-white px-2.5 py-0.5 rounded-md mb-3">
              2. KEY ACTIVITIES
            </span>
            <ul className="pl-4 m-0 text-xs text-[#172B3D] space-y-1.5 list-disc">
              <li>Survey planning &amp; questionnaire design</li>
              <li>Field data collection &amp; sampling selection</li>
              <li>Statistical data quality audit &amp; validation</li>
              <li>Data reporting &amp; metadata preparation</li>
            </ul>
            <div className="text-center mt-4">
              <ArrowRightOutlined className="text-lg text-[#2966A3]" />
            </div>
          </div>

          {/* Column 3: Competency Levels */}
          <div className="rounded-xl border border-[#BAE6FD] bg-[#F0F7FF] p-5">
            <span className="inline-block text-[11px] font-bold uppercase tracking-wider bg-[#3D7D70] text-white px-2.5 py-0.5 rounded-md mb-3">
              3. CURRENT COMPETENCY LEVELS
            </span>
            <div className="space-y-2 mt-1">
              {skillEntries.length ? skillEntries.map(([skill, lvl]) => (
                <div
                  key={skill}
                  className="bg-white rounded-lg border border-[#DCE7F0] p-2 flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-[#0B2641] truncate max-w-[150px]">{skill}</span>
                  <span className="text-[11px] font-bold text-[#2966A3] bg-[#D1E0EE]/60 px-2 py-0.5 rounded">
                    Level {lvl} / 5
                  </span>
                </div>
              )) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No current skills recorded" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
