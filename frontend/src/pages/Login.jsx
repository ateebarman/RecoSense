import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { loginUser } from '../services/api';

const Login = () => {
    const [id, setId] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const { login } = useUser(); const navigate = useNavigate();
    const handleSubmit = async (e) => {
        e.preventDefault(); setError('');
        if (!id || !password) { setError('User ID and password required.'); return; }
        try {
            const response = await loginUser(id.trim(), password);
            if (response.data) {
                const { token, user } = response.data;
                login(user.user_id, user.reviewerName, user.isAdmin, token);
                navigate('/');
            }
        } catch (err) { setError(err?.response?.data?.message || 'Invalid credentials. Please try again.'); }
    };
    return (
        <div className="login-container">
            <form onSubmit={handleSubmit} className="login-form">
                <h2>User Login</h2>
                <input type="text" placeholder="Enter your USER ID" value={id} onChange={(e) => setId(e.target.value)} />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="submit">Login</button>
                {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>}
                <p style={{ marginTop: '10px' }}>New here? <a href="/register">Register</a></p>
            </form>
        </div>
    );
};
export default Login;