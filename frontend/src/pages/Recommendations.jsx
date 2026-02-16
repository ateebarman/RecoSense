import React, { useEffect, useState } from "react";
import { getRecommendations, toggleLike } from "../services/api";
import { useUser } from "../context/UserContext";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, BrainCircuit, RefreshCw, AlertCircle } from "lucide-react";
import ProductCard from "../components/ProductCard";

const Recommendations = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState({ userId: "", recommendations: [] });
  const { user_id, likedProducts, toggleLikeProductLocally } = useUser();

  const fetchRecs = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getRecommendations(30, user_id);
      setData(res.data);
    } catch (e) {
      setError("Failed to load your personalized recommendations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecs();
  }, []);

  const handleLike = async (asin) => {
    try {
      toggleLikeProductLocally(asin);
      await toggleLike(user_id, asin);
    } catch (error) {
      console.error("Failed to update like status:", error);
      toggleLikeProductLocally(asin); // Revert
    }
  };

  const getModelClass = (model) => {
    if (!model) return "";
    const m = model.toLowerCase();
    if (m.includes("hybrid neural engine")) return "hybrid";
    if (m.includes("demographic")) return "demographic";
    return "";
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="header-content"
        >
          <div className="welcome-badge">
            <BrainCircuit size={14} />
            <span>Hybrid Analytical Discovery</span>
          </div>
          <h1>Matched For <span className="gradient-text">You</span></h1>
          <p>Our RoBERTa & LightFM models analyzed your behavior to find these gems.</p>
        </motion.div>

        <div className="header-actions">
          {data.model_used && (
            <div className={`model-chip ${getModelClass(data.model_used)}`}>
              <Sparkles size={14} />
              <span>Engine: {data.model_used}</span>
            </div>
          )}
          <button
            className="btn-secondary"
            onClick={fetchRecs}
            disabled={loading}
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Re-calculate
          </button>
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
            {[...Array(6)].map((_, i) => (
              <div key={i} className="shimmer-card"></div>
            ))}
          </motion.div>
        ) : error ? (
          <div className="empty-state error">
            <AlertCircle size={48} className="text-danger" />
            <h3>Oops! Something went wrong</h3>
            <p>{error}</p>
            <button className="btn-primary" onClick={fetchRecs}>Try Again</button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="product-grid"
          >
            {data.recommendations.map((rec, index) => {
              const images = Array.isArray(rec.images) ? rec.images : [];
              const refinedImages = images.map(img => {
                if (typeof img === 'string') return img;
                return img.large || img.thumb || (typeof img === 'object' ? Object.values(img)[0] : null);
              }).filter(Boolean);

              const product = {
                asin: rec.asin,
                title: rec.title || `Product ${rec.asin}`,
                price: rec.price ? (String(rec.price).startsWith('$') ? rec.price : `$${rec.price}`) : null,
                brand: rec.category || rec.brand || '',
                imageURLHighRes: refinedImages
              };

              return (
                <motion.div
                  key={rec.asin}
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
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {data.message && !loading && (
        <div className="footer-note">
          <Sparkles size={12} /> {data.message}
        </div>
      )}
    </div>
  );
};

export default Recommendations;
