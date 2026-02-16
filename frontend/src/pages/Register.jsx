import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { registerUser, loginUser } from '../services/api';
import { motion } from 'framer-motion';
import { UserPlus, User, Lock, MapPin, Sparkles, AlertCircle, ChevronRight } from 'lucide-react';

const Register = () => {
  const { login } = useUser();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    user_id: '',
    reviewerName: '',
    age_group: '25-34',
    gender: 'other',
    location: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.reviewerName || !form.password) {
      setError('Display name and password are required');
      return;
    }

    try {
      setLoading(true);
      const res = await registerUser(form);
      if (res && res.data) {
        // Auto-login after register
        const loginRes = await loginUser(res.data.user_id, form.password);
        if (loginRes && loginRes.data) {
          const { token, user } = loginRes.data;
          login(user.user_id, user.reviewerName, user.isAdmin, token);
          navigate('/shop');
        }
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="login-card"
        style={{ maxWidth: '500px' }}
      >
        <div className="login-header">
          <div className="login-icon">
            <UserPlus size={24} />
          </div>
          <h2>Join RecoSense</h2>
          <p>Create an account for personalized recommendations.</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form-content">
          {error && (
            <div className="form-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="input-group-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-field">
              <User className="input-icon" size={18} />
              <input
                name="reviewerName"
                placeholder="Display Name"
                value={form.reviewerName}
                onChange={handleChange}
              />
            </div>
            <div className="input-field">
              <Lock className="input-icon" size={18} />
              <input
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                type="password"
              />
            </div>
          </div>

          <div className="input-field">
            <User className="input-icon" size={18} />
            <input
              name="user_id"
              placeholder="Username (Optional)"
              value={form.user_id}
              onChange={handleChange}
            />
          </div>

          <div className="input-group-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-field">
              <select name="age_group" value={form.age_group} onChange={handleChange} className="styled-select">
                <option value="18-24">Age: 18-24</option>
                <option value="25-34">Age: 25-34</option>
                <option value="35-44">Age: 35-44</option>
                <option value="45-54">Age: 45-54</option>
                <option value="55+">Age: 55+</option>
              </select>
            </div>
            <div className="input-field">
              <select name="gender" value={form.gender} onChange={handleChange} className="styled-select">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="input-field">
            <MapPin className="input-icon" size={18} />
            <input
              name="location"
              placeholder="Location (e.g., USA, UK)"
              value={form.location}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="btn-primary w-full shadow-lg" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
            {!loading && <ChevronRight size={18} />}
          </button>

          <div className="form-footer">
            <p>Already a member? <Link to="/login">Login here</Link></p>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Register;
