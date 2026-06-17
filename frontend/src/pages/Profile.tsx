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
      showToast('Unable to load profile', 'error');
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
        showToast('Token does not exist', 'error');
        return;
      }

      if (!fullName.trim()) {
        showToast('Full name cannot be empty', 'error');
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

      showToast('Profile saved successfully', 'success');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      showToast(error?.message || 'Unable to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (passwords: { old: string; new: string; confirm: string }) => {
    try {
      setSavingPassword(true);

      if (!passwords.old || !passwords.new || !passwords.confirm) {
        showToast('Please fill in all fields', 'error');
        return false;
      }

      if (passwords.new !== passwords.confirm) {
        showToast('New password and confirm password do not match', 'error');
        return false;
      }

      if (passwords.new.length < 6) {
        showToast('New password must be at least 6 characters', 'error');
        return false;
      }

      if (!token) {
        showToast('Token does not exist', 'error');
        return false;
      }

      await api.changePassword(token, {
        old_password: passwords.old,
        new_password: passwords.new,
        confirm_password: passwords.confirm,
      });

      showToast('Password changed successfully', 'success');
      return true;
    } catch (error: any) {
      console.error('Error changing password:', error);
      showToast(error?.message || 'Unable to change password', 'error');
      return false;
    } finally {
      setSavingPassword(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="p-24 flex items-center justify-center min-h-screen">
        <p className="text-slate-600">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-24 flex items-center justify-center min-h-screen">
        <p className="text-slate-600">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="w-full p-24 max-w-7xl mx-auto space-y-24">
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
      <div className="bg-white rounded-2xl shadow-md p-24 mb-24 border border-slate-100">
        <h3 className="text-xl font-bold text-slate-900 mb-6">Learning Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard label="Vocabulary" value={profile.progress?.total_vocab_learned || 0} unit="words" color="blue" />
          <StatsCard label="Grammar" value={profile.progress?.total_grammar_learned || 0} unit="patterns" color="purple" />
          <StatsCard label="Kaiwa" value={profile.progress?.total_kaiwas || 0} unit="times" color="green" />
          <StatsCard label="Flashcards" value={profile.progress?.total_flashcard_reviews || 0} unit="cards" color="orange" />
        </div>
      </div>

      <PasswordForm onSave={handleChangePassword} saving={savingPassword} />

      {/* Logout Section */}
      <div className="mt-24">
        <button
          onClick={() => {
            showToast('Logged out', 'success');
            logout();
            navigate('/login');
          }}
          className="w-full bg-slate-100 text-slate-700 py-4 rounded-lg font-semibold hover:bg-slate-200 transition-colors border border-slate-200"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
