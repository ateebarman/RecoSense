import React, { useEffect, useState } from "react";
import { getRecommendations } from "../services/api";
import { useUser } from "../context/UserContext";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";

const Recommendations = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState({ userId: "", recommendations: [] });

  const fetchRecs = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getRecommendations(30, user_id);
      setData(res.data);
    } catch (e) {
      setError("Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  };

  const { user_id } = useUser();

  useEffect(() => {
    fetchRecs();
  }, []);

  return (
    <div className="container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2>Top Recommendations</h2>
        {/* <button onClick={fetchRecs}>Refresh (random user)</button> */}
      </div>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!loading && !error && (
        <>
          {data.model_used && <p style={{ color: 'green' }}>Model: {data.model_used}</p>}
          {data.message && <p style={{ color: 'gray' }}>{data.message}</p>}
          <div className="product-grid">
            {data.recommendations.map((rec) => {
              // Handle different image formats (flat strings or large/thumb objects)
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
                <ProductCard key={rec.asin} product={product} isLiked={false} onLike={() => { }} />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default Recommendations;
