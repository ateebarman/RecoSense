import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Zap, Camera, Smartphone, DollarSign, Cpu, ShieldCheck, Sparkles } from 'lucide-react';

const ProductCard = ({ product, isLiked, onLike }) => {
    const { addItemToCart } = useCart();
    const navigate = useNavigate();
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

    const handleOpenAI = (e) => {
        e.preventDefault();
        e.stopPropagation();
        navigate(`/product/${encodeURIComponent(product.asin)}?chat=true`);
    };

    const getAspectIcon = (aspect) => {
        switch (aspect?.toLowerCase()) {
            case 'battery': return <Zap size={12} />;
            case 'camera': return <Camera size={12} />;
            case 'screen': return <Smartphone size={12} />;
            case 'value': return <DollarSign size={12} />;
            case 'software': return <Cpu size={12} />;
            default: return <ShieldCheck size={12} />;
        }
    };

    return (
        <Link to={`/product/${encodeURIComponent(product.asin)}`} className="product-card-wrapper">
            <div className="product-card">
                <div className="product-image-container">
                    {product.topAspect && (
                        <div className="xai-badge">
                            {getAspectIcon(product.topAspect)}
                            <span>{product.topAspect} Peak</span>
                        </div>
                    )}
                    <img src={imageUrl} alt={product.title} loading="lazy" />
                </div>
                <div className="product-details">
                    <span className="category">{product.brand || 'Premium Device'}</span>
                    <h3>{product.title || 'No Title'}</h3>
                    <div className="product-footer">
                        <p className="price">{product.price || 'N/A'}</p>
                        <div className="product-card-actions">
                            <button
                                className="ai-quick-btn"
                                onClick={handleOpenAI}
                                title="Ask RecoSense AI"
                            >
                                <Sparkles size={16} />
                            </button>
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
