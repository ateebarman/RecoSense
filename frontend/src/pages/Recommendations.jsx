import React, { useEffect, useState } from "react";
import { getRecommendations } from "../services/api";
import { useUser } from "../context/UserContext";
import { Link } from "react-router-dom";

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
            {data.recommendations.map((rec) => (
              <div key={rec.asin} className="product-card">
                {rec.images && rec.images[0] && (
                  <img
                    src={rec.images[0].large || rec.images[0].thumb}
                    alt={rec.title}
                    style={{ maxHeight: 160, objectFit: "contain" }}
                  />
                )}
                <h4 title={rec.title}>{rec.title || `Product ${rec.asin}`}</h4>
                {rec.price !== null && <p>Price: $ {String(rec.price)}</p>}
                {rec.avg_rating > 0 && <p>Avg. Rating: {rec.avg_rating}/5</p>}
                {rec.category && <p>Category: {rec.category}</p>}
                {/* <p>
                  Score: {rec.score.toFixed(4)} | Sim:{" "}
                  {rec.similarity.toFixed(4)}
                </p> */}
                {rec.top_aspects && rec.top_aspects.length > 0 && (
                  <p>Strengths: {rec.top_aspects.join(", ")}</p>
                )}
                <Link to={`/product/${rec.asin}`}>View details</Link>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Recommendations;
