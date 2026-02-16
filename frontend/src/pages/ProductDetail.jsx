import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useCart } from '../context/CartContext';
import { getProductByAsin, getReviewsForProduct, addReview } from '../services/api';
import AddReviewForm from '../components/AddReviewForm';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShoppingBag,
    ChevronRight,
    Star,
    ShieldCheck,
    Truck,
    ChevronLeft,
    CircleCheck,
    Zap,
    Battery,
    Camera,
    Monitor,
    Cpu,
    Gem,
    Plus,
    Minus,
    MessageSquare
} from 'lucide-react';

const ProductDetail = () => {
    const { asin } = useParams();
    const { user_id, userName } = useUser();
    const { addItemToCart } = useCart();
    const [product, setProduct] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [isAddingToCart, setIsAddingToCart] = useState(false);

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
            } catch (err) {
                setError('Failed to fetch product details.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [asin]);

    const handleReviewAdded = async (reviewData) => {
        try {
            const newReview = await addReview(reviewData);
            setReviews((prevReviews) => [newReview.data, ...prevReviews]);
        } catch (error) {
            console.error('Failed to add review:', error);
            throw error;
        }
    };

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

    if (loading) return (
        <div className="page-container">
            <div className="loading-shimmer-grid">
                <div className="shimmer-card" style={{ height: '500px' }}></div>
                <div className="shimmer-card" style={{ height: '500px' }}></div>
            </div>
        </div>
    );

    if (error || !product) return (
        <div className="page-container">
            <div className="empty-state-premium">
                <h3>Product not found</h3>
                <p>{error || "We couldn't locate this specific device."}</p>
                <Link to="/shop" className="btn-primary">Back to Shop</Link>
            </div>
        </div>
    );

    const defaultImage = 'https://placehold.co/600x600/1e1e1e/white?text=Product+Image';
    const imageUrl = product.imageURLHighRes?.[0] || defaultImage;

    const renderAspectScores = (review) => {
        const aspects = [
            { label: 'Battery', key: 'battery_score', icon: <Battery size={12} /> },
            { label: 'Camera', key: 'camera_score', icon: <Camera size={12} /> },
            { label: 'Screen', key: 'screen_score', icon: <Monitor size={12} /> },
            { label: 'Price', key: 'price_score', icon: <Zap size={12} /> },
            { label: 'Software', key: 'software_score', icon: <Cpu size={12} /> },
            { label: 'Quality', key: 'quality_score', icon: <Gem size={12} /> }
        ];

        return (
            <div className="aspect-scores-row">
                {aspects.map(aspect => {
                    const score = review[aspect.key];
                    if (score && score !== 0) {
                        const isPositive = score > 0;
                        return (
                            <span key={aspect.key} className={`aspect-pill ${isPositive ? 'positive' : 'negative'}`}>
                                {aspect.icon} {isPositive ? '+' : ''}{score.toFixed(1)}
                            </span>
                        );
                    }
                    return null;
                })}
            </div>
        );
    };

    return (
        <div className="page-container">
            <div className="product-layout-premium">
                {/* Left: Product Images */}
                <motion.div
                    className="product-visual-section"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <div className="breadcrumb-nav">
                        <Link to="/shop">Shop</Link>
                        <ChevronRight size={14} />
                        <span>{product.brand}</span>
                    </div>
                    <div className="main-image-glass">
                        <img src={imageUrl} alt={product.title} />
                    </div>
                </motion.div>

                {/* Right: Product Details */}
                <motion.div
                    className="product-details-section"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <div className="brand-header">
                        <span className="brand-name">{product.brand}</span>
                        <div className="stock-status">
                            <CircleCheck size={14} />
                            <span>In Stock</span>
                        </div>
                    </div>

                    <h1 className="product-main-title">{product.title}</h1>

                    <div className="rating-summary">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} size={16} fill={i < 4 ? "var(--secondary)" : "none"} color="var(--secondary)" />
                        ))}
                        <span className="review-count">({reviews.length} Verified Reviews)</span>
                    </div>

                    <div className="price-tag-large">{product.price}</div>

                    <div className="description-section">
                        <h4>About this product</h4>
                        <div className="description-content">
                            {product.description?.map((line, i) => (
                                <p key={i}>{line}</p>
                            ))}
                        </div>
                    </div>

                    <div className="purchase-controls glass-card">
                        <div className="qty-picker">
                            <button onClick={() => setQuantity(q => Math.max(1, q - 1))}><Minus size={16} /></button>
                            <span>{quantity}</span>
                            <button onClick={() => setQuantity(q => q + 1)}><Plus size={16} /></button>
                        </div>
                        <button
                            className="btn-primary add-to-cart-big shadow-glow"
                            onClick={handleAddToCart}
                            disabled={isAddingToCart}
                        >
                            <ShoppingBag size={20} />
                            {isAddingToCart ? 'Syncing...' : 'Add to Bag'}
                        </button>
                    </div>

                    <div className="guarantees-grid">
                        <div className="guarantee-item">
                            <Truck size={18} />
                            <span>Fast Delivery</span>
                        </div>
                        <div className="guarantee-item">
                            <ShieldCheck size={18} />
                            <span>1 Year Warranty</span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Bottom: Reviews Section */}
            <div className="product-reviews-container">
                <div className="reviews-header-block">
                    <div className="header-text">
                        <h2>Analytics & <span className="gradient-text">Feedback</span></h2>
                        <p>Discover real technical insights from our community of enthusiasts.</p>
                    </div>
                </div>

                <div className="reviews-content-grid">
                    <div className="review-form-panel">
                        <AddReviewForm
                            asin={asin}
                            user_id={user_id}
                            reviewerName={userName}
                            onReviewAdded={handleReviewAdded}
                        />
                    </div>

                    <div className="reviews-feed-panel">
                        <AnimatePresence>
                            {reviews.length > 0 ? (
                                reviews.map((review, index) => (
                                    <motion.div
                                        key={review._id || index}
                                        className="review-card-premium glass-card"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <div className="rc-header">
                                            <div className="rc-user">
                                                <div className="rc-avatar">{review.reviewerName?.[0] || 'U'}</div>
                                                <div className="rc-user-meta">
                                                    <span className="rc-name">{review.reviewerName || 'Anonymous'}</span>
                                                    <span className="rc-date">{review.reviewTime}</span>
                                                </div>
                                            </div>
                                            <div className="rc-rating">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} size={14} fill={i < review.overall ? "var(--secondary)" : "none"} color="var(--secondary)" />
                                                ))}
                                            </div>
                                        </div>

                                        <h4 className="rc-summary">{review.summary}</h4>
                                        <p className="rc-body">{review.reviewText}</p>

                                        {renderAspectScores(review)}

                                        {review.verified && (
                                            <div className="rc-verified">
                                                <ShieldCheck size={14} />
                                                <span>Verified Collector</span>
                                            </div>
                                        )}
                                    </motion.div>
                                ))
                            ) : (
                                <div className="no-reviews-box">
                                    <MessageSquare size={48} />
                                    <p>Be the first to analyze this device.</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;