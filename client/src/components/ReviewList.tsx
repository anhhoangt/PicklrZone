import React from "react";
import { Review } from "../types";
import StarRating from "./StarRating";
import "./ReviewList.css";

interface ReviewListProps {
  reviews: Review[];
}

const ReviewList: React.FC<ReviewListProps> = ({ reviews }) => {
  if (reviews.length === 0) {
    return <p className="reviews-empty">No reviews yet. Be the first to review!</p>;
  }

  return (
    <div className="reviews-list">
      {reviews.map((review) => (
        <div key={review.id} className="review-item">
          <div className="review-header">
            <div className="review-user">
              {review.userPhotoURL ? (
                <img src={review.userPhotoURL} alt="" className="review-avatar" />
              ) : (
                <div className="review-avatar-placeholder">
                  {review.userName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <span className="review-username">{review.userName}</span>
                <span className="review-date">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <StarRating rating={review.rating} size={14} />
          </div>
          <p className="review-text">{review.text}</p>
        </div>
      ))}
    </div>
  );
};

export default ReviewList;
