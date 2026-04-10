import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { ArrowLeft, Upload, Lock, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProfileData {
  id: number;
  username: string;
  email: string;
  full_name: string;
  avatar_url: string;
  created_at: string;
  role: string;
  progress?: {
    total_vocab_learned: number;
    total_grammar_learned: number;
    total_kaiwas: number;
    total_flashcard_reviews: number;
  };
}

export default function Profile() {
  const { user, token, logout, updateUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Edit form states
  const [fullName, setFullName] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  
  // Password form states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  
  // Message states
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      if (!token) return;
      const data = await api.getProfile(token);
      setProfile(data);
      setFullName(data.full_name || '');
      setAvatarPreview(data.avatar_url || `https://picsum.photos/seed/${data.username}/200/200`);
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfileError('Không thể tải hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);

      if (!token) {
        showToast('Token không tồn tại', 'error');
        setSavingProfile(false);
        return;
      }

      if (!fullName.trim()) {
        showToast('Tên đầy đủ không thể trống', 'error');
        setSavingProfile(false);
        return;
      }

      const updateData: { full_name: string; avatar_url?: string } = {
        full_name: fullName,
      };

      // Convert file to base64 only if a new file was selected
      if (avatarFile) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            resolve(reader.result as string);
          };
          reader.onerror = () => {
            reject('Error reading file');
          };
          reader.readAsDataURL(avatarFile);
        });
        updateData.avatar_url = base64;
      }

      console.log('Saving profile with:', { 
        full_name: updateData.full_name, 
        avatar_url: updateData.avatar_url ? updateData.avatar_url.substring(0, 50) + '...' : 'not provided' 
      });

      const data = await api.updateProfile(token, updateData);
      
      console.log('Profile updated successfully:', data);

      setProfile({
        ...profile,
        full_name: data.full_name || profile?.full_name,
        avatar_url: data.avatar_url || profile?.avatar_url,
      } as ProfileData);
      setAvatarFile(null);
      
      // Only update preview if avatar was updated
      if (data.avatar_url) {
        setAvatarPreview(data.avatar_url);
      }
      
      // Sync with global auth context so TopBar updates immediately
      updateUser({
        full_name: data.full_name,
        avatar_url: data.avatar_url,
      });
      
      showToast('Hồ sơ đã được lưu thành công', 'success');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      const errorMsg = error?.message || 'Không thể cập nhật hồ sơ';
      showToast(errorMsg, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setSavingPassword(true);

      // Validate input
      if (!oldPassword || !newPassword || !confirmPassword) {
        showToast('Vui lòng điền đầy đủ thông tin', 'error');
        setSavingPassword(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        showToast('Mật khẩu mới và xác minh mật khẩu không trùng khớp', 'error');
        setSavingPassword(false);
        return;
      }

      if (newPassword.length < 6) {
        showToast('Mật khẩu mới phải có ít nhất 6 ký tự', 'error');
        setSavingPassword(false);
        return;
      }

      if (!token) {
        showToast('Token không tồn tại', 'error');
        return;
      }

      console.log('Changing password...');
      
      const response = await api.changePassword(token, {
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      console.log('Password changed successfully:', response);

      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Mật khẩu đã được thay đổi thành công', 'success');
    } catch (error: any) {
      console.error('Error changing password:', error);
      const errorMsg = error?.message || 'Không thể thay đổi mật khẩu';
      showToast(errorMsg, 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="p-10 flex items-center justify-center min-h-screen">
        <p className="text-slate-600">Đang tải hồ sơ...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-10 flex items-center justify-center min-h-screen">
        <p className="text-slate-600">Không tìm thấy hồ sơ</p>
      </div>
    );
  }

  return (
    <div className="p-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-10">
        <button
          onClick={() => navigate('/')}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-slate-600" />
        </button>
        <h1 className="text-3xl font-bold text-slate-900">Hồ Sơ Cá Nhân</h1>
      </div>

      {/* Main Profile Card */}
      <div className="bg-gradient-to-br from-blue-300/40 via-purple-300/40 to-pink-300/40 rounded-2xl p-12 text-slate-900 mb-8 border border-blue-200/50 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-6">
          {/* Avatar */}
          <div className="relative">
            <img
              src={avatarPreview}
              alt="Avatar"
              className="w-40 h-40 rounded-full border-4 border-white object-cover shadow-lg"
              referrerPolicy="no-referrer"
            />
            <label className="absolute bottom-2 right-2 bg-white rounded-full p-3 cursor-pointer hover:bg-blue-50 transition-colors shadow-lg border-2 border-blue-200">
              <Upload className="w-5 h-5 text-blue-600" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          </div>

          {/* User Info - Centered */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900">{profile.full_name || profile.username}</h2>
            <p className="text-lg font-semibold text-blue-600 mt-1">@{profile.username}</p>
          </div>
        </div>
      </div>

      {/* Profile Success/Error Messages */}
      {profileSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          ✓ {profileSuccess}
        </div>
      )}
      {profileError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          ✗ {profileError}
        </div>
      )}

      {/* Information Section */}
      <div className="bg-white rounded-2xl shadow-md p-8 mb-8 border border-slate-100">
        <h3 className="text-xl font-bold text-slate-900 mb-6">Thông Tin Cơ Bản</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Full Name */}
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

          {/* Username (Read-only) */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Tên Đăng Nhập</label>
            <input
              type="text"
              value={profile?.username || ''}
              disabled
              className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
            />
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
            <input
              type="email"
              value={profile?.email || ''}
              disabled
              className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
            />
          </div>

          {/* Account Created Date (Read-only) */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Ngày Tạo Tài Khoản</label>
            <input
              type="text"
              value={profile?.created_at ? formatDate(profile.created_at) : ''}
              disabled
              className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
            />
          </div>
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={savingProfile}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {savingProfile ? 'Đang lưu...' : 'Lưu Thay Đổi'}
        </button>
      </div>

      {/* Statistics Section */}
      <div className="bg-white rounded-2xl shadow-md p-8 mb-8 border border-slate-100">
        <h3 className="text-xl font-bold text-slate-900 mb-6">Thống Kê Học Tập</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
            <p className="text-sm text-blue-700 font-medium">Từ Vựng</p>
            <p className="text-2xl font-bold text-blue-900 mt-2">
              {profile.progress?.total_vocab_learned || 0} <span className="text-lg">từ</span>
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
            <p className="text-sm text-purple-700 font-medium">Ngữ Pháp</p>
            <p className="text-2xl font-bold text-purple-900 mt-2">
              {profile.progress?.total_grammar_learned || 0} <span className="text-lg">mẫu</span>
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
            <p className="text-sm text-green-700 font-medium">Hội Thoại</p>
            <p className="text-2xl font-bold text-green-900 mt-2">
              {profile.progress?.total_kaiwas || 0} <span className="text-lg">lần</span>
            </p>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
            <p className="text-sm text-orange-700 font-medium">Flash Card</p>
            <p className="text-2xl font-bold text-orange-900 mt-2">
              {profile.progress?.total_flashcard_reviews || 0} <span className="text-lg">thẻ</span>
            </p>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-white rounded-2xl shadow-md p-8 border border-slate-100">
        <div className="flex items-center gap-2 mb-6">
          <Lock className="w-5 h-5 text-red-600" />
          <h3 className="text-xl font-bold text-slate-900">Bảo Mật</h3>
        </div>

        {/* Password Success/Error Messages */}
        {passwordSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            ✓ {passwordSuccess}
          </div>
        )}
        {passwordError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            ✗ {passwordError}
          </div>
        )}

        <div className="space-y-4">
          {/* Old Password */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Mật Khẩu Cũ</label>
            <div className="relative">
              <input
                type={showOldPassword ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập mật khẩu cũ"
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-700"
              >
                {showOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Mật Khẩu Mới</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-700"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Xác Minh Mật Khẩu Mới</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Xác minh mật khẩu mới"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-700"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            onClick={handleChangePassword}
            disabled={savingPassword}
            className="w-full bg-red-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 mt-6"
          >
            {savingPassword ? 'Đang xử lý...' : 'Đổi Mật Khẩu'}
          </button>
        </div>
      </div>

      {/* Logout Section */}
      <div className="mt-8">
        <button
          onClick={() => {
            showToast('Đã đăng xuất', 'success');
            logout();
            navigate('/login');
          }}
          className="w-full bg-slate-100 text-slate-700 py-4 rounded-lg font-semibold hover:bg-slate-200 transition-colors border border-slate-200"
        >
          Đăng Xuất
        </button>
      </div>
    </div>
  );
}
