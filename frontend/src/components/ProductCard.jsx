import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ShoppingCart, Heart } from 'lucide-react';

const ProductCard = ({ product, isLiked, onLike }) => {
    const { addItemToCart } = useCart();
    const [isAddingToCart, setIsAddingToCart] = useState(false);

    const defaultImage = 'https://placehold.co/400x500/1e1e1e/white?text=No+Image';
    const imageUrl = product.imageURLHighRes?.[0] || defaultImage;

    const handleAddToCart = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            setIsAddingToCart(true);
            await addItemToCart(product.asin, product, 1);
        } catch (error) {
            console.error('Failed to add item to cart', error);
        } finally {
            setIsAddingToCart(false);
        }
    };

    return (
        <Link to={`/product/${encodeURIComponent(product.asin)}`} className="product-card-wrapper">
            <div className="product-card">
                <div className="product-image-container">
                    <img src={imageUrl} alt={product.title} loading="lazy" />
                </div>
                <div className="product-details">
                    <span className="category">{product.brand || 'Premium Device'}</span>
                    <h3>{product.title || 'No Title'}</h3>
                    <div className="product-footer">
                        <p className="price">{product.price || 'N/A'}</p>
                        <div className="product-card-actions">
                            <button
                                className={`like-btn ${isLiked ? 'liked' : ''}`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onLike(product.asin);
                                }}
                                aria-label={isLiked ? 'Unlike' : 'Like'}
                            >
                                <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
                            </button>
                            <button
                                className="add-cart-btn"
                                onClick={handleAddToCart}
                                disabled={isAddingToCart}
                            >
                                <ShoppingCart size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
};
export default ProductCard;
