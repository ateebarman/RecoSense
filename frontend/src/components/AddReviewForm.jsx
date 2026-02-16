import React, { useState } from 'react';
import { Star, Send, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AddReviewForm = ({ asin, user_id, reviewerName, onReviewAdded }) => {
    const [rating, setRating] = useState(5);
    const [summary, setSummary] = useState('');
    const [reviewText, setReviewText] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!summary || !reviewText) {
            setError('Please provide both a summary and your detailed experience.');
            return;
        }

        setIsSubmitting(true);
        const reviewData = {
            asin,
            user_id,
            reviewerName,
            overall: Number(rating),
            summary,
            reviewText
        };

        try {
            await onReviewAdded(reviewData);
            setRating(5);
            setSummary('');
            setReviewText('');
            setError('');
        } catch (err) {
            setError('We encountered an error uploading your analysis. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="add-review-form-premium">
            <h3 className="form-title">Submit Review</h3>

            <AnimatePresence>
                {error && (
                    <motion.div
                        className="error-alert"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="form-group-premium">
                <label>Technical Rating</label>
                <div className="star-rating-input">
                    {[1, 2, 3, 4, 5].map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => setRating(s)}
                            className={s <= rating ? 'star active' : 'star'}
                        >
                            <Star size={24} fill={s <= rating ? "var(--secondary)" : "none"} />
                        </button>
                    ))}
                </div>
            </div>

            <div className="form-group-premium">
                <label>Summary</label>
                <input
                    type="text"
                    className="input-premium"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="e.g. Exceptional build quality, average battery"
                />
            </div>

            <div className="form-group-premium">
                <label>Detailed Experience</label>
                <textarea
                    className="input-premium textarea"
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Describe your technical findings and daily usage..."
                    rows="4"
                ></textarea>
            </div>

            <button
                type="submit"
                className="btn-primary w-full submit-review-btn"
                disabled={isSubmitting}
            >
                {isSubmitting ? 'Processing...' : 'Upload Review'}
                {!isSubmitting && <Send size={16} />}
            </button>
        </form>
    );
};

export default AddReviewForm;