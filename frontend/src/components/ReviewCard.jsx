import React from 'react';

const ReviewCard = ({ review }) => {
    const { productDetails } = review;
    const defaultImage = 'https://via.placeholder.com/120';
    const imageUrl = productDetails?.imageURLHighRes?.[0] || defaultImage;
    return (
        <div className="review-card">
            <div className="review-card-product-image">
                <img src={imageUrl} alt={productDetails?.title || 'Product'} />
            </div>
            <div className="review-card-content">
                <h4>{productDetails?.title || 'Product Not Found'}</h4>
                <p className="rating">Rating: {review.overall}/5</p>
                <p><strong>{review.summary}</strong></p>
                <p>{review.reviewText}</p>
            </div>
        </div>
    );
};
export default ReviewCard;