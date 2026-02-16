import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { loginUser } from '../services/api';
import { motion } from 'framer-motion';
import { Lock, User, LogIn, AlertCircle, Sparkles } from 'lucide-react';

const Login = () => {
    const [id, setId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useUser();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!id || !password) { setError('User ID and password required.'); return; }
        try {
            const response = await loginUser(id.trim(), password);
            if (response.data) {
                const { token, user } = response.data;
                login(user.user_id, user.reviewerName, user.isAdmin, token);
                navigate('/shop');
            }
        } catch (err) {
            setError(err?.response?.data?.message || 'Invalid credentials. Please try again.');
        }
    };

    return (
        <div className="auth-page-container">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="login-card"
            >
                <div className="login-header">
                    <div className="login-icon">
                        <Sparkles size={24} />
                    </div>
                    <h2>Welcome Back</h2>
                    <p>Enter your details to access your personalized shop.</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form-content">
                    {error && (
                        <div className="form-error">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="input-field">
                        <User className="input-icon" size={20} />
                        <input
                            type="text"
                            placeholder="User ID"
                            value={id}
                            onChange={(e) => setId(e.target.value)}
                        />
                    </div>

                    <div className="input-field">
                        <Lock className="input-icon" size={20} />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="btn-primary w-full shadow-lg">
                        <LogIn size={20} />
                        Login to Account
                    </button>

                    <div className="form-footer">
                        <p>Don't have an account? <Link to="/register">Create one</Link></p>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default Login;