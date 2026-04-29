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
        <div className="relative">
          <img
            src={avatarPreview}
            alt="Avatar"
            className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white object-cover shadow-lg"
            referrerPolicy="no-referrer"
          />
          <label className="absolute bottom-1 right-1 md:bottom-2 md:right-2 bg-white rounded-full p-3 cursor-pointer hover:bg-blue-50 transition-colors shadow-lg border-2 border-blue-200">
            <Upload className="w-5 h-5 text-blue-600" />
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
