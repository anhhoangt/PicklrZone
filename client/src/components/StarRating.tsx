import React from "react";
import "./StarRating.css";

interface StarRatingProps {
  rating: number;
  size?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, size = 16, interactive = false, onRate }) => {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="star-rating" style={{ fontSize: size }}>
      {stars.map((star) => {
        const filled = rating >= star;
        const half = !filled && rating >= star - 0.5;

        return (
          <span
            key={star}
            className={`star ${filled ? "star-filled" : half ? "star-half" : "star-empty"} ${
              interactive ? "star-interactive" : ""
            }`}
            onClick={() => interactive && onRate?.(star)}
          >
            ★
          </span>
        );
      })}
    </div>
  );
};

export default StarRating;
