import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const ProductCard = ({ product, isLiked, onLike }) => {
    const { addItemToCart } = useCart();
    const [isAddingToCart, setIsAddingToCart] = useState(false);

    const defaultImage = 'https://via.placeholder.com/200';
    const imageUrl = product.imageURLHighRes?.[0] || defaultImage;

    const handleAddToCart = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            setIsAddingToCart(true);
            await addItemToCart(product.asin, product, 1);
            alert('Item added to cart!');
        } catch (error) {
            alert('Failed to add item to cart');
        } finally {
            setIsAddingToCart(false);
        }
    };

    return (
        <Link to={`/product/${product.asin}`} className="product-card-link">
            <div className="product-card">
                <img src={imageUrl} alt={product.title} />
                <h3>{product.title || 'No Title'}</h3>
                <p>{product.brand || 'No Brand'}</p>
                <p className="price">{product.price || 'N/A'}</p>
                <div className="product-card-actions">
                    <button
                        className={`like-button ${isLiked ? 'liked' : ''}`}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onLike(product.asin);
                        }}
                    >
                        &#x2764;
                    </button>
                    <button
                        className="add-to-cart-btn"
                        onClick={handleAddToCart}
                        disabled={isAddingToCart}
                    >
                        {isAddingToCart ? '...' : '🛒 Add'}
                    </button>
                </div>
            </div>
        </Link>
    );
};
export default ProductCard;