import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import { getProducts, getUser, toggleLike } from '../services/api';
import ProductCard from '../components/ProductCard';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, LayoutGrid, Sparkles, Filter, ChevronLeft, ChevronRight, Search, BarChart3 } from 'lucide-react';

const Home = () => {
    const [products, setProducts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const pageSize = 12;
    const [sortBy, setSortBy] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const { user_id, userName, likedProducts, toggleLikeProductLocally } = useUser();

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchData = useCallback(async (opts = {}) => {
        setLoading(true);
        try {
            // Priority: sortBy/search > manual opts > default random
            const params = {
                ...opts,
                ...(sortBy && { sortBy }),
                ...(debouncedSearch && { search: debouncedSearch })
            };

            // If no filters/sorts, and no explicit opts, default to random for variety
            if (!sortBy && !debouncedSearch && Object.keys(opts).length === 0) {
                params.random = true;
                params.size = 60;
            }

            const productsRes = await getProducts(params);
            setProducts(productsRes.data || []);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    }, [sortBy, debouncedSearch]); // Removed user_id dependency since we use global state

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        setCurrentPage(1);
    }, [products]);

    const handleLike = async (asin) => {
        try {
            toggleLikeProductLocally(asin);
            await toggleLike(user_id, asin);
        } catch (error) {
            console.error("Failed to update like status:", error);
            toggleLikeProductLocally(asin); // Revert
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

                <div className="header-controls">
                    <div className="search-bar-wrapper">
                        <Search className="search-icon" size={18} />
                        <input
                            type="text"
                            placeholder="Search by title or brand..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                    </div>

                    <div className="filter-group">
                        <div className="sort-wrapper">
                            <BarChart3 className="sort-icon" size={18} />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="styled-select"
                            >
                                <option value="">Sort by: Latest</option>
                                <option value="battery">Best Battery Sentiment</option>
                                <option value="camera">Best Camera Sentiment</option>
                                <option value="screen">Best Screen Sentiment</option>
                                <option value="price">Best Value for Money</option>
                                <option value="quality">Build Quality focus</option>
                            </select>
                        </div>

                        <button
                            className="btn-secondary btn-icon-only"
                            onClick={() => {
                                setSortBy('');
                                setSearchQuery('');
                                fetchData({ random: true, size: 60 });
                            }}
                            title="Refresh Catalog"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
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
                                <h3>No matching products</h3>
                                <p>Try adjusting your sentiment filters or search query.</p>
                                <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => { setSortBy(''); setSearchQuery(''); }}>
                                    Reset Filters
                                </button>
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
