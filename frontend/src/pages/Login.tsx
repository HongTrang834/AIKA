import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { KeyRound, Mail, User, ArrowLeft, Send, CheckCircle2, ShieldAlert } from 'lucide-react';

const Login: React.FC = () => {
  const [view, setView] = useState<'login' | 'register' | 'verify' | 'forgot' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  
  // Verification states
  const [verificationCode, setVerificationCode] = useState('');
  
  // Password Reset states
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register, verifyEmail } = useAuth();
  const navigate = useNavigate();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      if (err.code === 'EMAIL_NOT_VERIFIED') {
        setEmail(err.email || email);
        setInfoMessage('Account not verified. Please enter the verification code sent to your email.');
        setView('verify');
      } else {
        setError(err.message || 'Invalid credentials. Please double check your email and password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      const data = await register(username, email, password, fullName);
      setInfoMessage(data.message || 'Registration successful! Please check your email for the verification code.');
      setView('verify');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Username or email might already be in use.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      await verifyEmail(email, verificationCode);
      setInfoMessage('Email verified successfully!');
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Incorrect or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      const data = await api.resendVerification(email);
      setInfoMessage(data.message || 'A new verification code has been sent to your email.');
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);

    try {
      const data = await api.forgotPassword(email);
      setInfoMessage(data.message || 'A password recovery code has been sent to your email.');
      setView('reset');
    } catch (err: any) {
      setError(err.message || 'Unable to process request. Please check your email address.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const data = await api.resetPassword({ email, code: resetCode, new_password: newPassword });
      setInfoMessage(data.message || 'Password reset successfully! Please log in with your new password.');
      setView('login');
      setPassword('');
      setResetCode('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Incorrect or expired password reset code.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchView = (newView: typeof view) => {
    setView(newView);
    setError('');
    setInfoMessage('');
    
    // Reset sensitive password states and codes on any view switch
    setPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setVerificationCode('');
    setResetCode('');

    // Clear input fields when switching between main entry flows
    if (newView === 'login' || newView === 'register') {
      setEmail('');
      setUsername('');
      setFullName('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-indigo-100 flex items-center justify-center p-6 relative overflow-hidden font-din-round">
      {/* Decorative Blur Circles for Premium Aesthetics */}
      <div className="absolute top-[-10%] left-[-10%] w-[35rem] h-[35rem] bg-indigo-300 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[35rem] h-[35rem] bg-indigo-200 rounded-full blur-3xl opacity-25 pointer-events-none"></div>

      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white shadow-2xl w-full max-w-lg p-8 md:p-10 relative z-10 transition-all duration-300">
        
        {/* Logo / Brand Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-black tracking-tight text-indigo-600 mb-2 drop-shadow-sm font-feather">AIKa</h1>
          <p className="text-gray-500 font-semibold text-base">N2 Japanese Learning & AI Partner</p>
        </div>

        {/* Alerts / Notifications */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-base font-semibold flex items-start gap-3 shadow-sm animate-shake">
            <ShieldAlert className="w-5.5 h-5.5 shrink-0 text-rose-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        
        {infoMessage && (
          <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 text-indigo-800 rounded-xl text-base font-medium flex items-start gap-3 shadow-sm">
            <CheckCircle2 className="w-5.5 h-5.5 shrink-0 text-indigo-500 mt-0.5" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* View Switch / Render Forms */}
        {view === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                  <Mail className="w-5.5 h-5.5" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium text-base text-gray-800 placeholder-gray-400 font-din-round"
                  style={{ paddingLeft: '3.5rem' }}
                  placeholder="your@email.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold uppercase tracking-wider text-gray-500">Password</label>
                <button
                  type="button"
                  onClick={() => handleSwitchView('forgot')}
                  className="text-sm font-bold text-indigo-600 hover:text-indigo-800 hover:underline focus:outline-none"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                  <KeyRound className="w-5.5 h-5.5" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium text-base text-gray-800 placeholder-gray-400 font-din-round"
                  style={{ paddingLeft: '3.5rem' }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-lg rounded-xl shadow-lg shadow-indigo-600/20 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 font-din-round"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : 'Log In'}
            </button>

            <div className="text-center pt-2">
              <p className="text-base text-gray-500 font-medium">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => handleSwitchView('register')}
                  className="text-indigo-600 font-bold hover:underline"
                >
                  Sign Up
                </button>
              </p>
            </div>
          </form>
        )}

        {view === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                  <User className="w-5.5 h-5.5" />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium text-base text-gray-800 placeholder-gray-400 font-din-round"
                  style={{ paddingLeft: '3.5rem' }}
                  placeholder="user_123"
                  autoComplete="new-username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                  <User className="w-5.5 h-5.5" />
                </span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium text-base text-gray-800 placeholder-gray-400 font-din-round"
                  style={{ paddingLeft: '3.5rem' }}
                  placeholder="John Doe"
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                  <Mail className="w-5.5 h-5.5" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium text-base text-gray-800 placeholder-gray-400 font-din-round"
                  style={{ paddingLeft: '3.5rem' }}
                  placeholder="your@email.com"
                  autoComplete="new-email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                  <KeyRound className="w-5.5 h-5.5" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium text-base text-gray-800 placeholder-gray-400 font-din-round"
                  style={{ paddingLeft: '3.5rem' }}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-lg rounded-xl shadow-lg active:translate-y-0.5 transition-all flex items-center justify-center gap-2 mt-2 font-din-round"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : 'Create Account'}
            </button>

            <div className="text-center pt-2">
              <p className="text-base text-gray-500 font-medium">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => handleSwitchView('login')}
                  className="text-indigo-600 font-bold hover:underline"
                >
                  Log In
                </button>
              </p>
            </div>
          </form>
        )}

        {view === 'verify' && (
          <form onSubmit={handleVerifySubmit} className="space-y-6">
            <div className="text-center">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7" />
              </div>
              <p className="text-base text-gray-600 font-medium px-4">
                A 6-digit verification code has been sent to <strong className="text-gray-800">{email}</strong>.
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-gray-500 mb-2 text-center">Verification Code</label>
              <input
                type="text"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center tracking-[12px] text-3xl font-bold py-3.5 bg-gray-50/50 border-2 border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-800 font-din-round"
                placeholder="000000"
                required
              />
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={loading}
                className="flex-1 py-3.5 border border-gray-200 hover:bg-gray-50 font-bold text-base text-gray-600 rounded-xl transition-all font-din-round"
              >
                Resend Code
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base rounded-xl shadow-lg active:translate-y-0.5 transition-all flex items-center justify-center gap-2 font-din-round"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : 'Verify'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleSwitchView('login')}
              className="w-full text-center text-base font-bold text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1.5 transition-colors font-din-round"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Log In
            </button>
          </form>
        )}

        {view === 'forgot' && (
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
            <div className="text-center mb-2">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <KeyRound className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Reset Password</h3>
              <p className="text-sm text-gray-500 font-medium px-4">
                Enter the email address associated with your account, and we'll send you a password reset code.
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                  <Mail className="w-5.5 h-5.5" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium text-base text-gray-800 placeholder-gray-400 font-din-round"
                  style={{ paddingLeft: '3.5rem' }}
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base rounded-xl shadow-lg active:translate-y-0.5 transition-all flex items-center justify-center gap-2 font-din-round"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Send Code
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSwitchView('login')}
              className="w-full text-center text-base font-bold text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1.5 transition-colors pt-2 font-din-round"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Log In
            </button>
          </form>
        )}

        {view === 'reset' && (
          <form onSubmit={handleResetPasswordSubmit} className="space-y-5">
            <div className="text-center mb-2">
              <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <KeyRound className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Set New Password</h3>
              <p className="text-sm text-gray-500 font-medium px-4">
                Enter the 6-digit code sent to <strong className="text-gray-700">{email}</strong> and your new password.
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">Verification Code</label>
              <input
                type="text"
                maxLength={6}
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center tracking-[10px] text-xl font-bold py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-800 font-din-round"
                placeholder="000000"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                  <KeyRound className="w-5.5 h-5.5" />
                </span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium text-base text-gray-800 placeholder-gray-400 font-din-round"
                  style={{ paddingLeft: '3.5rem' }}
                  placeholder="New password (min 6 characters)"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">Confirm New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                  <KeyRound className="w-5.5 h-5.5" />
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium text-base text-gray-800 placeholder-gray-400 font-din-round"
                  style={{ paddingLeft: '3.5rem' }}
                  placeholder="Re-enter new password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-lg rounded-xl shadow-lg active:translate-y-0.5 transition-all flex items-center justify-center gap-2 mt-2 font-din-round"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : 'Reset Password'}
            </button>

            <button
              type="button"
              onClick={() => handleSwitchView('login')}
              className="w-full text-center text-base font-bold text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1.5 transition-colors pt-2 font-din-round"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Log In
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default Login;
