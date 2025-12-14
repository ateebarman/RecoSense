import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { getUser } from '../services/api';

const Login = () => {
    const [id, setId] = useState(''); const [error, setError] = useState(''); const { login } = useUser(); const navigate = useNavigate();
    const handleSubmit = async (e) => {
        e.preventDefault(); setError('');
        if (!id) { setError('User ID cannot be empty.'); return; }
        try {
            const response = await getUser(id.trim());
            if (response.data) { login(response.data.user_id, response.data.reviewerName); navigate('/'); }
        } catch (err) { setError('Invalid User ID. Please try again.'); }
    };
    return (
        <div className="login-container">
            <form onSubmit={handleSubmit} className="login-form">
                <h2>User Login</h2>
                <input type="text" placeholder="Enter your USER ID" value={id} onChange={(e) => setId(e.target.value)} />
                <button type="submit">Login</button>
                {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>}
            </form>
        </div>
    );
};
export default Login;