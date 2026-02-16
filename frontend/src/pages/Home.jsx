import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { getProducts, getUser, toggleLike } from '../services/api';
import ProductCard from '../components/ProductCard';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, LayoutGrid, Sparkles, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

const Home = () => {
    const [products, setProducts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const pageSize = 12;
    const [likedProducts, setLikedProducts] = useState(new Set());
    const { user_id, userName } = useUser();

    const fetchData = async (opts = { random: true, size: 60 }) => {
        setLoading(true);
        try {
            const productsRes = await getProducts(opts);
            setProducts(productsRes.data || []);
            if (user_id) {
                const userRes = await getUser(user_id);
                setLikedProducts(new Set(userRes.data.likedProducts || []));
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user_id]);

    useEffect(() => {
        setCurrentPage(1);
    }, [products]);

    const handleLike = async (asin) => {
        try {
            await toggleLike(user_id, asin);
            setLikedProducts(prevLiked => {
                const newLiked = new Set(prevLiked);
                if (newLiked.has(asin)) {
                    newLiked.delete(asin);
                } else {
                    newLiked.add(asin);
                }
                return newLiked;
            });
        } catch (error) {
            console.error("Failed to update like status:", error);
        }
    };

    const totalPages = Math.max(1, Math.ceil(products.length / pageSize));
    const start = (currentPage - 1) * pageSize;
    const visibleProducts = products.slice(start, start + pageSize);

    return (
        <div className="page-container">
            <header className="page-header">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="header-content"
                >
                    <div className="welcome-badge">
                        <Sparkles size={14} />
                        <span>Welcome back, {userName}!</span>
                    </div>
                    <h1>Explore <span className="gradient-text">Premium Devices</span></h1>
                    <p>Discover the latest smartphones curated just for you.</p>
                </motion.div>

                <div className="header-actions">
                    <button
                        className="btn-secondary"
                        onClick={() => fetchData({ random: true, size: 60 })}
                        disabled={loading}
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <button className="btn-primary" onClick={() => fetchData({})}>
                        <LayoutGrid size={18} />
                        View All
                    </button>
                </div>
            </header>

            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="loading-shimmer-grid"
                    >
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="shimmer-card"></div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="product-grid"
                    >
                        {visibleProducts.length ? visibleProducts.map((product, index) => (
                            <motion.div
                                key={product.asin}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <ProductCard
                                    product={product}
                                    isLiked={likedProducts.has(product.asin)}
                                    onLike={handleLike}
                                />
                            </motion.div>
                        )) : (
                            <div className="empty-state">
                                <h3>No products found</h3>
                                <p>Try refreshing the list or checking back later.</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        className="btn-nav"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="page-indicator">
                        <span>Page</span>
                        <span className="current">{currentPage}</span>
                        <span>of</span>
                        <span className="total">{totalPages}</span>
                    </div>
                    <button
                        className="btn-nav"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default Home;
