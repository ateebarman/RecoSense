import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { getProducts, getUser, toggleLike } from '../services/api';
import ProductCard from '../components/ProductCard';

const LikedProducts = () => {
    const [liked, setLiked] = useState([]);
    const { user_id } = useUser();

    const fetchLikedProducts = async () => {
        try {
            const userRes = await getUser(user_id);
            const likedAsins = new Set(userRes.data.likedProducts);
            if (likedAsins.size === 0) {
                setLiked([]);
                return;
            }
            const productsRes = await getProducts(); // In a real app, might fetch only liked ones
            const filteredProducts = productsRes.data.filter(p => likedAsins.has(p.asin));
            setLiked(filteredProducts);
        } catch (error) { console.error("Failed to fetch liked products:", error); }
    };

    useEffect(() => {
        if (user_id) { fetchLikedProducts(); }
    }, [user_id]);

    const handleUnlike = async (asin) => {
        try {
            await toggleLike(user_id, asin);
            fetchLikedProducts(); // Refetch the list after unliking
        } catch (error) { console.error("Failed to unlike product:", error); }
    };

    return (
        <div>
            <h1 className="page-title">My Liked Products</h1>
            {liked.length > 0 ? (
                <div className="product-grid">
                    {liked.map(product => (
                        <ProductCard key={product.asin} product={product} isLiked={true} onLike={handleUnlike} />
                    ))}
                </div>
            ) : ( <p>You haven't liked any products yet.</p> )}
        </div>
    );
};
export default LikedProducts;