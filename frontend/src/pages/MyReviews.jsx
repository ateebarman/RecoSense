import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { getUserReviews } from '../services/api';
import ReviewCard from '../components/ReviewCard';

const MyReviews = () => {
    const [reviews, setReviews] = useState([]); const { user_id } = useUser();
    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const response = await getUserReviews(user_id);
                setReviews(response.data);
            } catch (error) { console.error("Failed to fetch user reviews:", error); }
        };
        if (user_id) { fetchReviews(); }
    }, [user_id]);
    return (
        <div>
            <h1 className="page-title">My Reviews</h1>
            {reviews.length > 0 ? (
                <div className="review-list">
                    {reviews.map((review, index) => ( <ReviewCard key={`${review.asin}-${index}`} review={review} /> ))}
                </div>
            ) : ( <p>You have not written any reviews.</p> )}
        </div>
    );
};
export default MyReviews;