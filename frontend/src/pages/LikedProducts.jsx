import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { getUser, getProducts, toggleLike } from '../services/api';
import ProductCard from '../components/ProductCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const LikedProducts = () => {
    const [liked, setLiked] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user_id } = useUser();

    const fetchLikedProducts = async () => {
        try {
            setLoading(true);
            const userRes = await getUser(user_id);
            const likedAsins = new Set(userRes.data.likedProducts || []);

            if (likedAsins.size === 0) {
                setLiked([]);
                return;
            }

            // In a production app, we'd have an endpoint to fetch specific products by ASINs
            // For now, we fetch the catalogue and filter (as per original logic)
            const productsRes = await getProducts({ size: 200 });
            const filteredProducts = (productsRes.data || []).filter(p => likedAsins.has(p.asin));
            setLiked(filteredProducts);
        } catch (error) {
            console.error("Failed to fetch liked products:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user_id) { fetchLikedProducts(); }
    }, [user_id]);

    const handleUnlike = async (asin) => {
        try {
            await toggleLike(user_id, asin);
            setLiked(prev => prev.filter(p => p.asin !== asin));
        } catch (error) {
            console.error("Failed to unlike product:", error);
        }
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="header-content"
                >
                    <div className="welcome-badge">
                        <Heart size={14} fill="currentColor" />
                        <span>Your Favorites</span>
                    </div>
                    <h1>Personal <span className="gradient-text">Wishlist</span></h1>
                    <p>You have {liked.length} item{liked.length !== 1 ? 's' : ''} saved for later.</p>
                </motion.div>

                {liked.length > 0 && (
                    <div className="header-actions">
                        <Link to="/shop" className="btn-secondary">
                            <ShoppingBag size={18} />
                            Continue Shopping
                        </Link>
                    </div>
                )}
            </header>

            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="loading-shimmer-grid"
                    >
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="shimmer-card"></div>
                        ))}
                    </motion.div>
                ) : liked.length > 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="product-grid"
                    >
                        {liked.map((product, index) => (
                            <motion.div
                                key={product.asin}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <ProductCard
                                    product={product}
                                    isLiked={true}
                                    onLike={handleUnlike}
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="empty-state"
                    >
                        <div className="empty-icon-wrapper">
                            <Heart size={48} className="text-dim" />
                        </div>
                        <h3>Your wishlist is empty</h3>
                        <p>Explore our collection and tap the heart icon to save products you love.</p>
                        <Link to="/shop" className="btn-primary" style={{ marginTop: '1.5rem', display: 'inline-flex' }}>
                            <Sparkles size={18} />
                            Start Exploring
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LikedProducts;