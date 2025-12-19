import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { registerUser, loginUser } from '../services/api';

const Register = () => {
  const { login } = useUser();
  const navigate = useNavigate();
  const [form, setForm] = useState({ user_id: '', reviewerName: '', age_group: '25-34', gender: 'other', location: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await registerUser(form);
      if (res && res.data) {
        // Auto-login after register
        if (form.password) {
          const loginRes = await loginUser(res.data.user_id, form.password);
          if (loginRes && loginRes.data) {
            const { token, user } = loginRes.data;
            login(user.user_id, user.reviewerName, user.isAdmin, token);
          }
        }
        navigate('/');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Register New User</h2>
        <input name="user_id" placeholder="Optional: user id" value={form.user_id} onChange={handleChange} />
        <input name="reviewerName" placeholder="Display name" value={form.reviewerName} onChange={handleChange} />
        <input name="password" placeholder="Password" value={form.password} onChange={handleChange} type="password" />
        <select name="age_group" value={form.age_group} onChange={handleChange}>
          <option value="18-24">18-24</option>
          <option value="25-34">25-34</option>
          <option value="35-44">35-44</option>
          <option value="45-54">45-54</option>
          <option value="55+">55+</option>
        </select>
        <select name="gender" value={form.gender} onChange={handleChange}>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        <input name="location" placeholder="Location (e.g., US, India)" value={form.location} onChange={handleChange} />
        <button type="submit">Register</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
    </div>
  );
};

export default Register;
