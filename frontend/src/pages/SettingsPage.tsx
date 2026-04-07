import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  User as UserIcon, 
  Mail, 
  Lock, 
  Shield, 
  Eye, 
  EyeOff,
  Save,
  Trash2,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const SettingsPage = () => {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const canDeleteOwnAccount = user?.role === 'USER';

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/users/profile', { name: formData.name });
      await refreshUser();
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      return setMessage({ type: 'error', text: 'Passwords do not match' });
    }
    setLoading(true);
    try {
      await api.put('/users/password', { 
        currentPassword: formData.currentPassword, 
        newPassword: formData.newPassword 
      });
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to change password' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!canDeleteOwnAccount) {
      setMessage({ type: 'error', text: 'Only regular users can delete their own account.' });
      return;
    }

    setDeletingAccount(true);
    setMessage({ type: '', text: '' });

    try {
      await api.delete('/users/me');
      logout();
      navigate('/auth', { replace: true });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || err.response?.data?.error || 'Failed to delete account' });
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-12">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Settings</h1>
          <p className="text-slate-500 mt-2 font-medium">Manage your account preferences and security.</p>
        </div>

        {message.text && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-8 p-4 rounded-2xl flex items-center space-x-3 ${
              message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
            }`}
          >
            {message.type === 'success' ? <Save className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
            <span className="font-bold text-sm">{message.text}</span>
          </motion.div>
        )}

        <div className="grid grid-cols-1 gap-8">
          
          {/* Profile Section */}
          <section className="bg-white rounded-[40px] p-10 shadow-xl shadow-slate-100 border border-slate-50">
            <div className="flex items-center space-x-3 mb-8">
              <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600">
                <UserIcon className="w-6 h-6" />
              </div>
              <h2 className="font-black text-slate-900 uppercase tracking-widest text-sm">Profile Information</h2>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <input 
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 transition-all"
                      placeholder="Your Name"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <input 
                      type="email"
                      value={formData.email}
                      readOnly
                      className="w-full pl-12 pr-4 py-4 bg-slate-100 border-none rounded-2xl font-bold text-slate-400 cursor-not-allowed"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button 
                  type="submit"
                  disabled={loading}
                  className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </section>

          {/* Password Section */}
          <section className="bg-white rounded-[40px] p-10 shadow-xl shadow-slate-100 border border-slate-50">
            <div className="flex items-center space-x-3 mb-8">
              <div className="bg-violet-50 p-3 rounded-2xl text-violet-600">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="font-black text-slate-900 uppercase tracking-widest text-sm">Security</h2>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Current Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                    className="w-full pl-12 pr-12 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 transition-all"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">New Password</label>
                  <input 
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                    className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 transition-all"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Confirm New Password</label>
                  <input 
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button 
                  type="submit"
                  disabled={loading}
                  className="px-8 py-4 bg-violet-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-violet-700 transition-all shadow-lg shadow-violet-200 disabled:opacity-50 flex items-center space-x-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </section>

          {canDeleteOwnAccount && (
            <section className="bg-red-50 rounded-[40px] p-10 border border-red-100">
              <div className="flex items-center space-x-3 mb-8">
                <div className="bg-red-100 p-3 rounded-2xl text-red-600">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h2 className="font-black text-red-900 uppercase tracking-widest text-sm">Danger Zone</h2>
              </div>
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <p className="font-bold text-red-900">Delete Account</p>
                  <p className="text-xs text-red-700 font-medium">Once you delete your account, there is no going back. Please be certain.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  disabled={deletingAccount}
                  className="px-8 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-200 disabled:opacity-50"
                >
                  Delete Account
                </button>
              </div>
            </section>
          )}

          {canDeleteOwnAccount && showDeleteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => !deletingAccount && setShowDeleteModal(false)} />
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.96 }}
                className="relative w-full max-w-lg rounded-4xl bg-white p-8 shadow-2xl shadow-slate-900/20 border border-slate-100"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                    <Trash2 className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Delete account?</h3>
                    <p className="mt-2 text-sm font-medium text-slate-500 leading-relaxed">
                      This will permanently remove your account, profile, and access to CivicWatch. This cannot be undone.
                    </p>
                  </div>
                </div>

                {message.text && message.type === 'error' && (
                  <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
                    {message.text}
                  </div>
                )}

                <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    disabled={deletingAccount}
                    className="rounded-2xl border border-slate-200 px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await handleDeleteAccount();
                    }}
                    disabled={deletingAccount}
                    className="rounded-2xl bg-red-600 px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-red-200 transition-colors hover:bg-red-700 disabled:opacity-50"
                  >
                    {deletingAccount ? 'Deleting...' : 'Yes, delete my account'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
