import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { getMe, getUserOrders, getUserReviews } from '../services/api';
import { motion } from 'framer-motion';
import {
    User,
    Mail,
    MapPin,
    Calendar,
    Package,
    Star,
    Heart,
    Settings,
    ChevronRight,
    LogOut,
    Shield,
    Clock
} from 'lucide-react';
import '../styles/Profile.css';

const Profile = () => {
    const { logout, user_id } = useUser();
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState({
        orders: 0,
        reviews: 0,
        likes: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const [userRes, ordersRes, reviewsRes] = await Promise.all([
                    getMe(),
                    getUserOrders(user_id),
                    getUserReviews(user_id)
                ]);

                if (userRes && userRes.data) {
                    setProfile(userRes.data);
                    setStats({
                        orders: ordersRes?.data?.length || 0,
                        reviews: reviewsRes?.data?.length || 0,
                        likes: userRes.data.likedProducts?.length || 0
                    });
                }
            } catch (error) {
                console.error("Error fetching profile data:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user_id) {
            fetchProfileData();
        }
    }, [user_id]);

    if (loading) {
        return (
            <div className="profile-container">
                <div className="loading-shimmer-grid">
                    <div className="shimmer-card" style={{ height: '400px' }}></div>
                    <div className="shimmer-card" style={{ height: '400px' }}></div>
                </div>
            </div>
        );
    }

    if (!profile) {
        return <div className="profile-container">User not found</div>;
    }

    return (
        <div className="profile-container">
            <header className="page-header">
                <div className="header-content">
                    <div className="welcome-badge">
                        <User size={14} />
                        <span>Member Dashboard</span>
                    </div>
                    <h1>Your <span className="gradient-text">Profile</span></h1>
                </div>
            </header>

            <div className="profile-grid-layout">
                {/* Sidebar */}
                <aside className="profile-sidebar">
                    <motion.div
                        className="glass-card profile-card-main"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="profile-avatar-large">
                            {profile.reviewerName?.charAt(0) || 'U'}
                        </div>
                        <h2 className="profile-name-big">{profile.reviewerName}</h2>
                        <span className="profile-id-tag">ID: {profile.user_id}</span>

                        {profile.isAdmin && (
                            <div className="badge-premium" style={{ marginTop: '1rem' }}>
                                <Shield size={14} />
                                <span>System Architect</span>
                            </div>
                        )}
                    </motion.div>

                    <motion.div
                        className="glass-card profile-nav-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <nav className="profile-nav-list">
                            <button className="profile-nav-link active">
                                <User size={18} />
                                <span>Overview</span>
                                <ChevronRight size={16} style={{ marginLeft: 'auto' }} />
                            </button>
                            <button className="profile-nav-link" onClick={() => window.location.href = '/orders'}>
                                <Package size={18} />
                                <span>My Orders</span>
                                <ChevronRight size={16} style={{ marginLeft: 'auto' }} />
                            </button>
                            <button className="profile-nav-link" onClick={() => window.location.href = '/reviews'}>
                                <Star size={18} />
                                <span>My Reviews</span>
                                <ChevronRight size={16} style={{ marginLeft: 'auto' }} />
                            </button>
                            <button className="profile-nav-link" onClick={() => window.location.href = '/liked'}>
                                <Heart size={18} />
                                <span>Wishlist</span>
                                <ChevronRight size={16} style={{ marginLeft: 'auto' }} />
                            </button>
                            <div style={{ margin: '1rem 0', borderTop: '1px solid var(--border)' }}></div>
                            <button className="profile-nav-link" onClick={() => window.location.href = '/change-password'}>
                                <Settings size={18} />
                                <span>Security</span>
                                <ChevronRight size={16} style={{ marginLeft: 'auto' }} />
                            </button>
                            <button className="profile-nav-link logout-btn" onClick={logout}>
                                <LogOut size={18} />
                                <span>Signature Out</span>
                            </button>
                        </nav>
                    </motion.div>
                </aside>

                {/* Main Content */}
                <main className="profile-main-content">
                    {/* Stats Row */}
                    <div className="stats-row-premium">
                        <motion.div
                            className="glass-card stat-box-premium"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <span className="stat-box-val">{stats.orders}</span>
                            <span className="stat-box-label">Successful Orders</span>
                        </motion.div>
                        <motion.div
                            className="glass-card stat-box-premium"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            <span className="stat-box-val">{stats.reviews}</span>
                            <span className="stat-box-label">Technical Reviews</span>
                        </motion.div>
                        <motion.div
                            className="glass-card stat-box-premium"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            <span className="stat-box-val">{stats.likes}</span>
                            <span className="stat-box-label">Saved Collections</span>
                        </motion.div>
                    </div>

                    {/* Personal Info */}
                    <motion.div
                        className="glass-card info-section-premium"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <div className="info-section-header">
                            <h3><User size={20} className="text-primary" /> Personal Analytics</h3>
                        </div>

                        <div className="details-grid-premium">
                            <div className="detail-item-premium">
                                <span className="detail-label">Full Identifier</span>
                                <span className="detail-value">{profile.reviewerName}</span>
                            </div>
                            <div className="detail-item-premium">
                                <span className="detail-label">System Node</span>
                                <span className="detail-value">{profile.location || 'Default Region'}</span>
                            </div>
                            <div className="detail-item-premium">
                                <span className="detail-label">Demographic Bracket</span>
                                <span className="detail-value">{profile.age_group || 'Not Specified'}</span>
                            </div>
                            <div className="detail-item-premium">
                                <span className="detail-label">Gender Classification</span>
                                <span className="detail-value" style={{ textTransform: 'capitalize' }}>{profile.gender || 'Undisclosed'}</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Account Security Info (Placeholder) */}
                    <motion.div
                        className="glass-card info-section-premium"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        <div className="info-section-header">
                            <h3><Shield size={20} className="text-secondary" /> Security Overview</h3>
                        </div>
                        <div className="details-grid-premium">
                            <div className="detail-item-premium">
                                <span className="detail-label">Member Since</span>
                                <span className="detail-value">{new Date(profile.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="detail-item-premium">
                                <span className="detail-label">Last Signature Update</span>
                                <span className="detail-value"><Clock size={14} style={{ display: 'inline', marginRight: '4px' }} /> Recent</span>
                            </div>
                        </div>
                    </motion.div>
                </main>
            </div>
        </div>
    );
};

export default Profile;
