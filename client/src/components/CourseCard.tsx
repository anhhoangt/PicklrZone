import React from "react";
import { Link } from "react-router-dom";
import { Course } from "../types";
import StarRating from "./StarRating";
import "./CourseCard.css";

interface CourseCardProps {
  course: Course;
}

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  return (
    <Link to={`/courses/${course.id}`} className="course-card">
      <div className="course-card-thumb">
        {course.thumbnailUrl ? (
          <img src={course.thumbnailUrl} alt={course.title} />
        ) : (
          <div className="course-card-thumb-placeholder">🏓</div>
        )}
        <span className="course-card-level">{course.level}</span>
      </div>

      <div className="course-card-body">
        <h3 className="course-card-title">{course.title}</h3>
        <p className="course-card-desc">{course.shortDescription}</p>

        <div className="course-card-vendor">
          <span>by {course.vendorName}</span>
          {course.vendorLocation && (
            <span className="course-card-location">📍 {course.vendorLocation}</span>
          )}
        </div>

        <div className="course-card-footer">
          <div className="course-card-rating">
            <StarRating rating={course.averageRating} size={14} />
            <span className="course-card-rating-text">
              {course.averageRating > 0 ? course.averageRating.toFixed(1) : "New"}
            </span>
            <span className="course-card-reviews">({course.totalReviews})</span>
          </div>
          <span className="course-card-price">
            {course.price === 0 ? "Free" : `$${course.price.toFixed(2)}`}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;
