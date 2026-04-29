// frontend/src/components/profile/ProfileForm.tsx
import React from 'react';

interface ProfileFormProps {
  fullName: string;
  setFullName: (name: string) => void;
  username: string;
  email: string;
  createdAt: string;
  onSave: () => void;
  saving: boolean;
}

const ProfileForm: React.FC<ProfileFormProps> = ({
  fullName,
  setFullName,
  username,
  email,
  createdAt,
  onSave,
  saving,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-md p-8 mb-8 border border-slate-100">
      <h3 className="text-xl font-bold text-slate-900 mb-6">Thông Tin Cơ Bản</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Tên Đầy Đủ</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Nhập tên của bạn"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Tên Đăng Nhập</label>
          <input
            type="text"
            value={username}
            disabled
            className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Ngày Tạo Tài Khoản</label>
          <input
            type="text"
            value={createdAt}
            disabled
            className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
          />
        </div>
      </div>
      <button
        onClick={onSave}
        disabled={saving}
        className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
      </button>
    </div>
  );
};

export default ProfileForm;
