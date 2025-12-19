import React, { useState } from 'react';
import { changePassword } from '../services/api';

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); setMessage('');
    if (!currentPassword || !newPassword) return setMessage('Both fields required');
    if (newPassword !== confirm) return setMessage('New password and confirm do not match');
    try {
      await changePassword(currentPassword, newPassword);
      setMessage('Password updated successfully');
      setCurrentPassword(''); setNewPassword(''); setConfirm('');
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Failed to update password');
    }
  };

  return (
    <div className="change-password-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Change Password</h2>
        <input type="password" placeholder="Current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        <input type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <input type="password" placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <button type="submit">Change Password</button>
        {message && <p style={{ marginTop: '10px' }}>{message}</p>}
      </form>
    </div>
  );
};

export default ChangePassword;