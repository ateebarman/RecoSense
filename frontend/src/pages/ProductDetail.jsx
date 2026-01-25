import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useCart } from '../context/CartContext';
import { getProductByAsin, getReviewsForProduct, addReview } from '../services/api';
import AddReviewForm from '../components/AddReviewForm';

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
            console.error('Failed to add review from parent:', error);
            throw error;
        }
    };

    const handleAddToCart = async () => {
        try {
            setIsAddingToCart(true);
            await addItemToCart(product.asin, product, quantity);
            alert(`Added ${quantity} item(s) to cart!`);
            setQuantity(1);
        } catch (error) {
            alert('Failed to add item to cart');
        } finally {
            setIsAddingToCart(false);
        }
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p className="error-message">{error}</p>;
    if (!product) return <p>Product not found.</p>;

    const defaultImage = 'https://placehold.co/400x400/1e1e1e/white?text=No+Image';
    const imageUrl = product.imageURLHighRes?.[0] || defaultImage;

    const renderAspectScores = (review) => {
        const aspects = [
            { label: '🔋 Battery', key: 'battery_score' },
            { label: '📸 Camera', key: 'camera_score' },
            { label: '📱 Screen', key: 'screen_score' },
            { label: '💰 Price', key: 'price_score' },
            { label: '⚙️ Software', key: 'software_score' },
            { label: '💎 Quality', key: 'quality_score' }
        ];

        return (
            <div className="aspect-scores">
                {aspects.map(aspect => {
                    const score = review[aspect.key];
                    if (score && score !== 0) {
                        const isPositive = score > 0;
                        return (
                            <span key={aspect.key} className={`aspect-badge ${isPositive ? 'pos' : 'neg'}`}>
                                {aspect.label}: {isPositive ? '+' : ''}{score.toFixed(1)}
                            </span>
                        );
                    }
                    return null;
                })}
            </div>
        );
    };

    return (
        <div className="product-detail-container">
            <div className="product-info">
                <div className="product-image-wrapper">
                    <img
                        src={imageUrl}
                        alt={product.title}
                        className="product-detail-image"
                    />
                </div>
                <div className="product-detail-text">
                    <div className="breadcrumb">Products &gt; {product.brand} &gt; {product.asin}</div>
                    <h1>{product.title}</h1>
                    <div className="brand-tag">{product.brand}</div>
                    <p className="price-detail">{product.price}</p>

                    <div className="description-box">
                        <h3>Description</h3>
                        <p>{product.description?.join(' ')}</p>
                    </div>

                    <div className="product-actions">
                        <div className="quantity-selector">
                            <label htmlFor="quantity">Quantity:</label>
                            <input
                                id="quantity"
                                type="number"
                                min="1"
                                max="100"
                                value={quantity}
                                onChange={(e) =>
                                    setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                                }
                            />
                        </div>
                        <button
                            className="add-to-cart-btn-detail"
                            onClick={handleAddToCart}
                            disabled={isAddingToCart}
                        >
                            {isAddingToCart ? 'Adding...' : '🛒 Add to Cart'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="reviews-section">
                <div className="reviews-header">
                    <h2>Customer Reviews</h2>
                    <p>{reviews.length} Verified Reviews</p>
                </div>

                <AddReviewForm
                    asin={asin}
                    user_id={user_id}
                    reviewerName={userName}
                    onReviewAdded={handleReviewAdded}
                />

                <div className="reviews-list">
                    {reviews.length > 0 ? (
                        reviews.map((review, index) => (
                            <div key={review._id || index} className="review-card">
                                <div className="review-meta">
                                    <div className="reviewer-info">
                                        <div className="user-avatar">{review.reviewerName?.[0] || 'U'}</div>
                                        <div>
                                            <span className="reviewer-name">{review.reviewerName || 'Anonymous'}</span>
                                            <span className="review-date">{review.reviewTime}</span>
                                        </div>
                                    </div>
                                    <div className="star-rating">
                                        {[...Array(5)].map((_, i) => (
                                            <span key={i} className={i < review.overall ? 'star filled' : 'star'}>★</span>
                                        ))}
                                    </div>
                                </div>

                                <h4 className="review-summary">{review.summary}</h4>
                                <div className="review-text-container">
                                    <p className="review-body">{review.reviewText}</p>
                                </div>

                                {renderAspectScores(review)}

                                {review.verified && <span className="verified-badge">✓ Verified Purchase</span>}
                            </div>
                        ))
                    ) : (
                        <p className="no-reviews">No reviews yet. Be the first to share your experience!</p>
                    )}
                </div>
            </div>
        </div>
    );
};
export default ProductDetail;