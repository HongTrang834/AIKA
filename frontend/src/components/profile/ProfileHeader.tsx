// frontend/src/components/profile/ProfileHeader.tsx
import React from 'react';
import { Upload } from 'lucide-react';

interface ProfileHeaderProps {
  avatarPreview: string;
  fullName: string;
  username: string;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  avatarPreview,
  fullName,
  username,
  onAvatarChange,
}) => {
  return (
    <div className="bg-gradient-to-br from-blue-300/40 via-purple-300/40 to-pink-300/40 rounded-2xl p-8 md:p-12 text-slate-900 mb-8 border border-blue-200/50 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-4">
          <img
            src={avatarPreview}
            alt="Avatar"
            className="rounded-full border-4 border-white object-cover shadow-lg bg-white"
            style={{ width: '160px', height: '160px' }}
            referrerPolicy="no-referrer"
          />
          <label className="flex items-center gap-2 bg-white rounded-full px-6 py-2 cursor-pointer hover:bg-sky-blue/10 hover:border-sky-blue transition-colors shadow-sm border-2 border-cloud-gray font-bold text-sky-blue text-[15px]">
            <Upload className="w-5 h-5" />Tải ảnh
            <input
              type="file"
              accept="image/*"
              onChange={onAvatarChange}
              className="hidden"
            />
          </label>
        </div>
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">{fullName}</h2>
          <p className="text-md md:text-lg font-semibold text-blue-600 mt-1">@{username}</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
