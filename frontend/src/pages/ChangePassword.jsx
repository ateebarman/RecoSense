import React, { useState } from 'react';
import { changePassword } from '../services/api';
import { motion } from 'framer-motion';
import { ShieldCheck, Key, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', text: '' });

    if (!currentPassword || !newPassword) {
      return setStatus({ type: 'error', text: 'All fields are required' });
    }
    if (newPassword !== confirm) {
      return setStatus({ type: 'error', text: 'New passwords do not match' });
    }

    try {
      setLoading(true);
      await changePassword(currentPassword, newPassword);
      setStatus({ type: 'success', text: 'Password updated successfully' });
      setCurrentPassword(''); setNewPassword(''); setConfirm('');
    } catch (err) {
      setStatus({ type: 'error', text: err?.response?.data?.message || 'Failed to update password' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="login-card"
      >
        <div className="login-header">
          <div className="login-icon">
            <Lock size={24} />
          </div>
          <h2>Security Settings</h2>
          <p>Update your password to keep your account secure.</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form-content">
          {status.text && (
            <div className={`form-${status.type}`}>
              {status.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
              <span>{status.text}</span>
            </div>
          )}

          <div className="input-field">
            <Key className="input-icon" size={20} />
            <input
              type="password"
              placeholder="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>

          <div className="input-field">
            <ShieldCheck className="input-icon" size={20} />
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className="input-field">
            <ShieldCheck className="input-icon" size={20} />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary w-full shadow-lg" disabled={loading}>
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default ChangePassword;