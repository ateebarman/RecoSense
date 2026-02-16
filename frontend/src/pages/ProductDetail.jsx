import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useCart } from '../context/CartContext';
import { getProductByAsin, getReviewsForProduct, addReview, toggleLike } from '../services/api';
import AddReviewForm from '../components/AddReviewForm';
import { motion, AnimatePresence } from 'framer-motion';
import AIChatModal from '../components/AIChatModal';
import {
    ShoppingBag,
    ChevronRight,
    Star,
    ShieldCheck,
    CircleCheck,
    Plus,
    Minus,
    MessageSquare,
    Sparkles,
    Loader2,
    AlertCircle,
    Heart
} from 'lucide-react';
import './ProductDetail.css';

const ProductDetail = () => {
    const { asin } = useParams();
    const location = useLocation();
    const { user_id, userName, likedProducts, toggleLikeProductLocally } = useUser();
    const { addItemToCart } = useCart();
    const [product, setProduct] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError('');
                const [productRes, reviewsRes] = await Promise.all([
                    getProductByAsin(asin),
                    getReviewsForProduct(asin),
                ]);
                setProduct(productRes.data);
                setReviews(reviewsRes.data);

                if (location.search.includes('chat=true')) {
                    setIsAIModalOpen(true);
                }
            } catch (err) {
                setError('Failed to fetch product details.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [asin, location.search]);

    const handleAddToCart = async () => {
        try {
            setIsAddingToCart(true);
            await addItemToCart(product.asin, product, quantity);
            setQuantity(1);
        } catch (error) {
            console.error('Add to cart failed:', error);
        } finally {
            setIsAddingToCart(false);
        }
    };

    const handleToggleLike = async () => {
        try {
            toggleLikeProductLocally(product.asin);
            await toggleLike(user_id, product.asin);
        } catch (error) {
            console.error('Toggle like failed:', error);
            // Revert if API fails
            toggleLikeProductLocally(product.asin);
        }
    };

    if (loading) return (
        <div className="product-detail-page min-h-screen flex items-center justify-center">
            <Loader2 size={40} className="animate-spin text-purple-500" />
        </div>
    );

    if (error || !product) return (
        <div className="product-detail-page min-h-screen flex flex-col items-center justify-center px-10 text-center">
            <AlertCircle size={60} className="text-red-500 mb-6 opacity-50" />
            <h1 className="text-4xl font-bold mb-4 text-white">Device Not Found</h1>
            <p className="text-xl text-slate-400 max-w-lg mb-10">{error || "The requested device model does not exist in our industrial database."}</p>
            <Link to="/shop" className="px-8 py-3 bg-purple-600 rounded-lg text-white font-bold hover:bg-purple-700 transition">Return to Shop</Link>
        </div>
    );

    const defaultImage = 'https://placehold.co/800x800/1e1e1e/white?text=Product+Image';
    const imageUrl = product.imageURLHighRes?.[0] || defaultImage;

    return (
        <div className="product-detail-page">
            <div className="pd-container">
                <div className="pd-nav-spacer"></div>


                {/* TOP SECTION: Image & Key Details (Title, Price, Rating) */}
                <div className="pd-top-section">
                    <div className="pd-image-wrapper">
                        <motion.div
                            className="pd-image-card"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <img src={imageUrl} alt={product.title} />
                        </motion.div>
                    </div>

                    <div className="pd-header-info pd-animate-fade">
                        <div className="pd-brand-badge">
                            <CircleCheck size={14} />
                            <span>Official {product.brand}</span>
                        </div>

                        <h1 className="pd-title flex items-center justify-between gap-4">
                            {product.title}
                            <button
                                className={`pd-wishlist-btn ${likedProducts?.has(product.asin) ? 'active' : ''}`}
                                onClick={handleToggleLike}
                                title={likedProducts?.has(product.asin) ? "Remove from Wishlist" : "Add to Wishlist"}
                            >
                                <Heart
                                    size={24}
                                    fill={likedProducts?.has(product.asin) ? "#ec4899" : "none"}
                                    color={likedProducts?.has(product.asin) ? "#ec4899" : "currentColor"}
                                />
                            </button>
                        </h1>

                        <div className="pd-rating">
                            <div className="flex gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={16} fill={i < 4 ? "#8b5cf6" : "none"} color="#8b5cf6" />
                                ))}
                            </div>
                            <span>{reviews.length} Verified Reviews</span>
                        </div>

                        <div className="pd-price">
                            {product.price || "N/A"}
                        </div>

                    </div>
                </div>

                {/* MIDDLE SECTION: Overview & Actions (Side by Side) */}
                <div className="pd-middle-section">
                    {/* Left: Overview */}
                    <div className="pd-overview-box pd-animate-fade">
                        <h4 className="pd-section-title">
                            <MessageSquare size={18} className="text-purple-400" />
                            Product Overview
                        </h4>
                        <div className="pd-desc-text space-y-4">
                            {(isExpanded ? product.description : product.description?.slice(0, 4))?.map((line, i) => (
                                <p key={i}>{line}</p>
                            ))}
                        </div>

                        {product.description?.length > 4 && (
                            <button
                                className="pd-expand-btn"
                                onClick={() => setIsExpanded(!isExpanded)}
                            >
                                {isExpanded ? 'See Less' : 'See More Content'}
                                <ChevronRight
                                    size={14}
                                    className={`transition-transform duration-300 ${isExpanded ? 'rotate-[-90deg]' : 'rotate-90'}`}
                                />
                            </button>
                        )}

                        <div className="pd-meta-grid">
                            <div className="pd-meta-item">
                                <span><strong>Condition</strong> Factory New</span>
                            </div>
                            <div className="pd-meta-item">
                                <span><strong>Warranty</strong> 1 Year Official</span>
                            </div>
                            <div className="pd-meta-item">
                                <span><strong>Return</strong> 30-Day Window</span>
                            </div>
                            <div className="pd-meta-item">
                                <span><strong>Support</strong> 24/7 Expert Help</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Actions Box */}
                    <div className="pd-actions-box pd-animate-fade">
                        <h4 className="pd-section-title mb-6">
                            <ShoppingBag size={18} className="text-purple-400" />
                            Render Purchase
                        </h4>

                        <div className="pd-actions-stack">
                            <button
                                className="pd-add-btn"
                                onClick={handleAddToCart}
                                disabled={isAddingToCart}
                            >
                                <ShoppingBag size={18} />
                                {isAddingToCart ? 'Syncing...' : 'Add to Cart'}
                            </button>

                            <div className="pd-qty-selector">
                                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="pd-qty-btn">
                                    <Minus size={16} />
                                </button>
                                <div className="pd-qty-value">
                                    <span className="pd-qty-label">Quantity</span>
                                    <span className="pd-qty-number">{quantity}</span>
                                </div>
                                <button onClick={() => setQuantity(q => q + 1)} className="pd-qty-btn">
                                    <Plus size={16} />
                                </button>
                            </div>

                            <button
                                className="pd-ai-btn"
                                onClick={() => setIsAIModalOpen(true)}
                            >
                                <Sparkles size={18} />
                                <span>Consult RecoSense AI</span>
                            </button>
                        </div>

                        <div className="mt-6 p-4 bg-black/20 rounded-xl border border-white/5 text-xs text-slate-400 leading-relaxed">
                            <div className="flex items-start gap-2">
                                <ShieldCheck size={14} className="text-green-500 shrink-0 mt-0.5" />
                                <p>Secure check-out powered by Stripe. Your data is encrypted and safe.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* AI Assistant Modal */}
                <AIChatModal
                    asin={asin}
                    productTitle={product.title}
                    isOpen={isAIModalOpen}
                    onClose={() => setIsAIModalOpen(false)}
                />
                {/* BOTTOM SECTION: Reviews & Feedback */}
                <div className="pd-reviews-section">
                    <h2 className="text-3xl font-bold mb-10 flex items-center gap-3">
                        <MessageSquare className="text-purple-400" size={28} />
                        Review Analysis
                    </h2>

                    <div className="reviews-grid">
                        {/* List of Reviews */}
                        <div className="reviews-list">
                            {reviews.length > 0 ? (
                                reviews.map((review, index) => (
                                    <motion.div
                                        key={review._id || index}
                                        className="review-card-premium"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <div className="review-header">
                                            <div className="reviewer-info">
                                                <span className="reviewer-name">{review.reviewerName || 'Anonymous Expert'}</span>
                                                <span className="review-date">
                                                    {review.reviewTime || 'Recently Processed'}
                                                </span>
                                            </div>
                                            <div className="review-stars">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={14}
                                                        fill={i < (review.overall || 5) ? "#8b5cf6" : "none"}
                                                        color="#8b5cf6"
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <h5 className="review-summary">{review.summary}</h5>
                                        <p className="review-text">{review.reviewText}</p>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="p-10 bg-white/5 rounded-2xl border border-white/5 text-center">
                                    <p className="text-slate-400">No technical reviews available for this model yet. Be the first to analyze.</p>
                                </div>
                            )}
                        </div>

                        {/* Submit Review Form */}
                        <div className="pd-review-form-container">
                            <AddReviewForm
                                asin={asin}
                                user_id={user_id}
                                reviewerName={userName}
                                onReviewAdded={async (reviewData) => {
                                    try {
                                        const res = await addReview(reviewData);
                                        setReviews([res.data, ...reviews]);
                                    } catch (err) {
                                        throw err;
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
