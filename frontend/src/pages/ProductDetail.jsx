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

    const defaultImage = 'https://via.placeholder.com/300';
    const imageUrl = product.imageURLHighRes?.[0] || defaultImage;

    return (
        <div className="product-detail-container">
            <div className="product-info">
                <img
                    src={imageUrl}
                    alt={product.title}
                    className="product-detail-image"
                />
                <div className="product-detail-text">
                    <h1>{product.title}</h1>
                    <h2>{product.brand}</h2>
                    <p className="price-detail">{product.price}</p>
                    <p>{product.description?.join(' ')}</p>

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
                <AddReviewForm
                    asin={asin}
                    user_id={user_id}
                    reviewerName={userName}
                    onReviewAdded={handleReviewAdded}
                />
                <h2>Customer Reviews</h2>
                <div className="reviews-list">
                    {reviews.length > 0 ? (
                        reviews.map((review, index) => (
                            <div key={index} className="review-item">
                                <h4>{review.summary}</h4>
                                <p className="rating">Rating: {review.overall}/5</p>
                                <p>{review.reviewText}</p>
                                <small>
                                    By: {review.reviewerName || 'Anonymous'} on{' '}
                                    {review.reviewTime}
                                </small>
                            </div>
                        ))
                    ) : (
                        <p>No reviews yet. Be the first to add one!</p>
                    )}
                </div>
            </div>
        </div>
    );
};
export default ProductDetail;