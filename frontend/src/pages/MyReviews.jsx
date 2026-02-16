import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { getUserReviews } from '../services/api';
import ReviewCard from '../components/ReviewCard';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, MessageCircle } from 'lucide-react';

const MyReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user_id } = useUser();

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                setLoading(true);
                const response = await getUserReviews(user_id);
                setReviews(response.data || []);
            } catch (error) {
                console.error("Failed to fetch user reviews:", error);
            } finally {
                setLoading(false);
            }
        };
        if (user_id) { fetchReviews(); }
    }, [user_id]);

    return (
        <div className="page-container">
            <header className="page-header">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="header-content"
                >
                    <div className="welcome-badge">
                        <MessageSquare size={14} />
                        <span>Your Activity</span>
                    </div>
                    <h1>My <span className="gradient-text">Reviews</span></h1>
                    <p>Manage and view all the products you've shared your thoughts on.</p>
                </motion.div>
            </header>

            <AnimatePresence mode="wait">
                {loading ? (
                    <div className="loading-shimmer-grid">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="shimmer-card" style={{ height: '200px' }}></div>
                        ))}
                    </div>
                ) : reviews.length > 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="review-list"
                    >
                        {reviews.map((review, index) => (
                            <motion.div
                                key={`${review.asin}-${index}`}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <ReviewCard review={review} />
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="empty-state">
                        <MessageCircle size={48} className="text-dim" style={{ marginBottom: '1.5rem' }} />
                        <h3>No reviews yet</h3>
                        <p>Share your experience with products to help others decide.</p>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MyReviews;