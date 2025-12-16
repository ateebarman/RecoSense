import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { getProducts, getUser, toggleLike } from '../services/api';
import ProductCard from '../components/ProductCard';

const Home = () => {
    const [products, setProducts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 12;
    const [likedProducts, setLikedProducts] = useState(new Set());
    const { user_id } = useUser();
    const fetchData = async (opts = { random: true, size: 60 }) => {
        try {
            const productsRes = await getProducts(opts);
            setProducts(productsRes.data || []);
            if (user_id) {
                const userRes = await getUser(user_id);
                setLikedProducts(new Set(userRes.data.likedProducts));
            } else {
                setLikedProducts(new Set());
            }
        } catch (error) { console.error("Failed to fetch data:", error); }
    };
    useEffect(() => { fetchData(); }, [user_id]);
    useEffect(() => { setCurrentPage(1); }, [products]);
    const handleLike = async (asin) => {
        try {
            await toggleLike(user_id, asin);
            setLikedProducts(prevLiked => { const newLiked = new Set(prevLiked); if (newLiked.has(asin)) { newLiked.delete(asin); } else { newLiked.add(asin); } return newLiked; });
        } catch (error) { console.error("Failed to update like status:", error); }
    };
    return (
        <div>
            <h1 className="page-title">All Smartphones</h1>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="page-actions">
                    <button onClick={() => fetchData({ random: true, size: 60 })}>Refresh</button>
                    <button onClick={() => fetchData({})}>Show All</button>
                </div>
            </div>
            <div className="product-grid">
                {(() => {
                    const totalPages = Math.max(1, Math.ceil(products.length / pageSize));
                    const start = (currentPage - 1) * pageSize;
                    const visible = products.slice(start, start + pageSize);
                    return visible.length ? visible.map(product => (
                        <ProductCard key={product.asin} product={product} isLiked={likedProducts.has(product.asin)} onLike={handleLike} />
                    )) : <p>No products found.</p>;
                })()}
            </div>
            <div className="pagination">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</button>
                <span>Page {currentPage} of {Math.max(1, Math.ceil(products.length / pageSize))}</span>
                <button onClick={() => setCurrentPage(p => Math.min(Math.max(1, Math.ceil(products.length / pageSize)), p + 1))} disabled={currentPage === Math.max(1, Math.ceil(products.length / pageSize))}>Next</button>
            </div>
        </div>
    );
};
export default Home;