import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileForm from '../components/profile/ProfileForm';
import PasswordForm from '../components/profile/PasswordForm';
import StatsCard from '../components/profile/StatsCard';

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
  const [savingPassword, setSavingPassword] = useState(false);

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
      showToast('Không thể tải hồ sơ', 'error');
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
        return;
      }

      if (!fullName.trim()) {
        showToast('Tên đầy đủ không thể trống', 'error');
        return;
      }

      const updateData: { full_name: string; avatar_url?: string } = {
        full_name: fullName,
      };

      if (avatarFile) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject('Error reading file');
          reader.readAsDataURL(avatarFile);
        });
        updateData.avatar_url = base64;
      }

      const data = await api.updateProfile(token, updateData);

      setProfile(prev => prev ? {
        ...prev,
        full_name: data.full_name || prev.full_name,
        avatar_url: data.avatar_url || prev.avatar_url,
      } : null);
      setAvatarFile(null);

      if (data.avatar_url) {
        setAvatarPreview(data.avatar_url);
      }

      updateUser({
        full_name: data.full_name,
        avatar_url: data.avatar_url,
      });

      showToast('Hồ sơ đã được lưu thành công', 'success');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      showToast(error?.message || 'Không thể cập nhật hồ sơ', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (passwords: { old: string; new: string; confirm: string }) => {
    try {
      setSavingPassword(true);

      if (!passwords.old || !passwords.new || !passwords.confirm) {
        showToast('Vui lòng điền đầy đủ thông tin', 'error');
        return;
      }

      if (passwords.new !== passwords.confirm) {
        showToast('Mật khẩu mới và xác minh mật khẩu không trùng khớp', 'error');
        return;
      }

      if (passwords.new.length < 6) {
        showToast('Mật khẩu mới phải có ít nhất 6 ký tự', 'error');
        return;
      }

      if (!token) {
        showToast('Token không tồn tại', 'error');
        return;
      }

      await api.changePassword(token, {
        old_password: passwords.old,
        new_password: passwords.new,
        confirm_password: passwords.confirm,
      });

      showToast('Mật khẩu đã được thay đổi thành công', 'success');
    } catch (error: any) {
      console.error('Error changing password:', error);
      showToast(error?.message || 'Không thể thay đổi mật khẩu', 'error');
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
    <div className="w-full p-8 max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-slate-600" />
        </button>
      </div>

      <ProfileHeader
        avatarPreview={avatarPreview}
        fullName={profile.full_name || profile.username}
        username={profile.username}
        onAvatarChange={handleAvatarChange}
      />

      <ProfileForm
        fullName={fullName}
        setFullName={setFullName}
        username={profile.username}
        email={profile.email}
        createdAt={formatDate(profile.created_at)}
        onSave={handleSaveProfile}
        saving={savingProfile}
      />

      {/* Statistics Section */}
      <div className="bg-white rounded-2xl shadow-md p-8 mb-8 border border-slate-100">
        <h3 className="text-xl font-bold text-slate-900 mb-6">Thống Kê Học Tập</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard label="Từ Vựng" value={profile.progress?.total_vocab_learned || 0} unit="từ" color="blue" />
          <StatsCard label="Ngữ Pháp" value={profile.progress?.total_grammar_learned || 0} unit="mẫu" color="purple" />
          <StatsCard label="Hội Thoại" value={profile.progress?.total_kaiwas || 0} unit="lần" color="green" />
          <StatsCard label="Flash Card" value={profile.progress?.total_flashcard_reviews || 0} unit="thẻ" color="orange" />
        </div>
      </div>

      <PasswordForm onSave={handleChangePassword} saving={savingPassword} />

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
