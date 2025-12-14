import React, { useState } from 'react';

const AddReviewForm = ({ asin, user_id, reviewerName, onReviewAdded }) => {
    const [rating, setRating] = useState(5); const [summary, setSummary] = useState(''); const [reviewText, setReviewText] = useState(''); const [error, setError] = useState('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!summary || !reviewText) { setError('Summary and review text cannot be empty.'); return; }
        const reviewData = { asin, user_id, reviewerName, overall: Number(rating), summary, reviewText };
        try {
            await onReviewAdded(reviewData);
            setRating(5); setSummary(''); setReviewText(''); setError('');
        } catch (err) { setError('Failed to submit review. Please try again.'); }
    };
    return (
        <form onSubmit={handleSubmit} className="add-review-form">
            <h3>Add Your Review</h3>
            {error && <p className="error-message">{error}</p>}
            <div className="form-group">
                <label>Rating:</label>
                <select value={rating} onChange={(e) => setRating(e.target.value)}>
                    <option value="5">5 Stars</option><option value="4">4 Stars</option><option value="3">3 Stars</option><option value="2">2 Stars</option><option value="1">1 Star</option>
                </select>
            </div>
            <div className="form-group">
                <label>Summary:</label>
                <input type="text" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="A short summary of your review" />
            </div>
            <div className="form-group">
                <label>Your Review:</label>
                <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Write your detailed review here" rows="5"></textarea>
            </div>
            <button type="submit">Submit Review</button>
        </form>
    );
};
export default AddReviewForm;