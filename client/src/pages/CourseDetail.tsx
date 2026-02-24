import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getCourse, getReviews, addReview, getUserProfile, getEnrollments } from "../services/api";
import { Course, Review, UserProfile } from "../types";
import VideoPlayer from "../components/VideoPlayer";
import StarRating from "../components/StarRating";
import ReviewList from "../components/ReviewList";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import "./CourseDetail.css";

const LEVEL_LABELS: Record<string, string> = {
  beginner: "🟢 Beginner — No prior experience needed",
  intermediate: "🟡 Intermediate — Some playing experience required",
  advanced: "🔴 Advanced — For competitive players",
  "all-levels": "⚪ All Levels — Everyone is welcome",
};

const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const { addToCart, isInCart } = useCart();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  // Review form
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const courseData = await getCourse(id!);
        setCourse(courseData);
      } catch (err) {
        console.error("Failed to load course", err);
      }

      try {
        const reviewData = await getReviews(id!);
        setReviews(reviewData);
      } catch (err) {
        console.error("Failed to load reviews", err);
      }

      if (currentUser) {
        try {
          const profile = await getUserProfile();
          setUserProfile(profile);
        } catch {}

        try {
          const enrollments = await getEnrollments();
          if (enrollments.some((e: any) => e.courseId === id)) {
            setIsEnrolled(true);
          }
        } catch {}
      }

      setLoading(false);
    };
    load();
  }, [id, currentUser]);

  const handleAddToCart = () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    if (course) {
      addToCart(course);
      setAddedToCart(true);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewRating || !reviewText.trim()) {
      setReviewError("Please provide a rating and review text");
      return;
    }
    setSubmitting(true);
    setReviewError("");
    try {
      const newReview = await addReview(id!, { rating: reviewRating, text: reviewText });
      setReviews([newReview, ...reviews]);
      setReviewRating(0);
      setReviewText("");
      setReviewSuccess(true);
      const updated = await getCourse(id!);
      setCourse(updated);
    } catch (err: any) {
      setReviewError(err.message || "Failed to submit review");
    }
    setSubmitting(false);
  };

  const sameLocation =
    userProfile?.location &&
    course?.vendorLocation &&
    userProfile.location.toLowerCase().trim() === course.vendorLocation.toLowerCase().trim();

  if (loading) {
    return (
      <div className="cd-loading">
        <span className="bounce-ball">🏓</span>
        <p>Loading course...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="cd-loading">
        <h2>Course not found</h2>
        <Link to="/courses" className="btn-app btn-app-filled">
          <span className="btn-ball">🏓</span>
          Back to Courses
        </Link>
      </div>
    );
  }

  const totalDuration = course.lessons?.reduce((sum, l) => sum + (l.duration || 0), 0) || 0;

  return (
    <div className="course-detail">
      {/* Hero */}
      <div className="cd-hero">
        <div className="cd-video-col">
          <VideoPlayer url={course.introVideoUrl} title={course.title} />
          <p className="cd-video-hint">🎬 Watch the intro video to see if this course is for you</p>
        </div>

        <div className="cd-info-col">
          <div className="cd-badges">
            <span className="cd-badge cd-badge-level">{course.level}</span>
            <span className="cd-badge cd-badge-category">{course.category}</span>
          </div>

          <h1 className="cd-title">{course.title}</h1>
          <p className="cd-short-desc">{course.shortDescription}</p>

          <div className="cd-meta">
            <div className="cd-rating">
              <StarRating rating={course.averageRating} size={18} />
              <span className="cd-rating-num">
                {course.averageRating > 0 ? course.averageRating.toFixed(1) : "New"}
              </span>
              <span className="cd-meta-text">({course.totalReviews} reviews)</span>
            </div>
            <span className="cd-meta-text">{course.totalStudents} students</span>
            <span className="cd-meta-text">{course.lessons?.length || 0} lessons</span>
            <span className="cd-meta-text">{totalDuration} min total</span>
          </div>

          <div className="cd-price-row">
            <span className="cd-price">
              {course.price === 0 ? "Free" : `$${course.price.toFixed(2)}`}
            </span>

          {isEnrolled ? (
              <div className="cd-enrolled-actions">
                <span className="cd-enrolled-badge">✅ Enrolled</span>
                <Link to={`/learn/${course.id}`} className="btn-app btn-app-filled cd-cart-btn">
                  <span className="btn-ball">🏓</span>
                  Go to Course
                </Link>
              </div>
            ) : course.price === 0 ? (
              <button className="btn-app btn-app-filled cd-cart-btn" onClick={handleAddToCart}>
                <span className="btn-ball">🏓</span>
                Enroll for Free
              </button>
            ) : isInCart(course.id) || addedToCart ? (
              <Link to="/cart" className="btn-app btn-app-outline cd-cart-btn">
                🛒 Go to Cart
              </Link>
            ) : (
              <button className="btn-app btn-app-filled cd-cart-btn" onClick={handleAddToCart}>
                <span className="btn-ball">🏓</span>
                Add to Cart
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="cd-body">
        {/* Left column */}
        <div className="cd-main-col">
          {/* What You'll Learn */}
          <section className="cd-section">
            <h2>What You'll Learn</h2>
            <div className="cd-description">{course.description}</div>
          </section>

          {/* Level / Who is this for */}
          <section className="cd-section">
            <h2>Who Is This Course For?</h2>
            <div className="cd-level-info">
              <span className="cd-level-badge">{LEVEL_LABELS[course.level] || course.level}</span>
            </div>
          </section>

          {/* Course Content / Lessons */}
          {course.lessons && course.lessons.length > 0 && (
            <section className="cd-section">
              <h2>
                Course Content
                <span className="cd-section-meta">
                  {course.lessons.length} lessons • {totalDuration} min
                </span>
              </h2>
              <div className="cd-lessons">
                {course.lessons
                  .sort((a, b) => a.order - b.order)
                  .map((lesson, idx) => (
                    <div key={idx} className="cd-lesson-item">
                      <span className="cd-lesson-num">{idx + 1}</span>
                      <div className="cd-lesson-info">
                        <span className="cd-lesson-title">{lesson.title}</span>
                        {lesson.description && (
                          <span className="cd-lesson-desc">{lesson.description}</span>
                        )}
                      </div>
                      {lesson.videoUrl && <span className="cd-lesson-video">▶️</span>}
                      {lesson.duration && (
                        <span className="cd-lesson-duration">{lesson.duration} min</span>
                      )}
                    </div>
                  ))}
              </div>
            </section>
          )}

          {/* Reviews */}
          <section className="cd-section">
            <h2>
              Reviews
              <span className="cd-section-meta">{course.totalReviews} reviews</span>
            </h2>

            {currentUser && !reviewSuccess && !isEnrolled && (
              <p className="review-enroll-hint">Purchase this course to leave a review.</p>
            )}

            {currentUser && isEnrolled && !reviewSuccess && (
              <form onSubmit={handleSubmitReview} className="review-form">
                <h3>Leave a Review</h3>
                {reviewError && <div className="review-form-error">{reviewError}</div>}
                <div className="review-form-rating">
                  <span>Your Rating:</span>
                  <StarRating rating={reviewRating} interactive onRate={setReviewRating} size={24} />
                </div>
                <textarea
                  placeholder="Share your experience with this course..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={4}
                />
                <button type="submit" className="btn-app btn-app-filled" disabled={submitting}>
                  <span className="btn-ball">🏓</span>
                  {submitting ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            )}

            {reviewSuccess && (
              <div className="review-success">✅ Your review has been submitted!</div>
            )}

            {!currentUser && (
              <p className="review-login-prompt">
                <Link to="/login">Log in</Link> to leave a review.
              </p>
            )}

            <ReviewList reviews={reviews} />
          </section>
        </div>

        {/* Right sidebar */}
        <div className="cd-sidebar-col">
          {/* Buy card (sticky) */}
          <div className="cd-buy-card">
            <h3>Get This Course</h3>
            <div className="cd-buy-price">
              {course.price === 0 ? "Free" : `$${course.price.toFixed(2)}`}
            </div>

            {isEnrolled ? (
              <div className="cd-enrolled-box">
                <p>✅ You own this course</p>
                <Link to={`/learn/${course.id}`} className="btn-app btn-app-filled cd-buy-btn">
                  <span className="btn-ball">🏓</span>
                  Go to Course
                </Link>
              </div>
            ) : isInCart(course.id) || addedToCart ? (
              <Link to="/cart" className="btn-app btn-app-filled cd-buy-btn">
                🛒 Go to Cart
              </Link>
            ) : (
              <button className="btn-app btn-app-filled cd-buy-btn" onClick={handleAddToCart}>
                <span className="btn-ball">🏓</span>
                {course.price === 0 ? "Enroll for Free" : "Add to Cart"}
              </button>
            )}

            <ul className="cd-buy-includes">
              <li>📹 {course.lessons?.length || 0} video lessons</li>
              <li>⏱️ {totalDuration} minutes of content</li>
              <li>📱 Access on any device</li>
              <li>🏆 Certificate of completion</li>
              <li>♾️ Lifetime access</li>
            </ul>
          </div>

          {/* Instructor card */}
          <div className="cd-vendor-card">
            <h3>Instructor</h3>
            <div className="cd-vendor-info">
              {course.vendorPhotoURL ? (
                <img src={course.vendorPhotoURL} alt="" className="cd-vendor-avatar" />
              ) : (
                <div className="cd-vendor-avatar-placeholder">
                  {course.vendorName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <span className="cd-vendor-name">{course.vendorName}</span>
                {course.vendorLocation && (
                  <span className="cd-vendor-location">📍 {course.vendorLocation}</span>
                )}
              </div>
            </div>

            {sameLocation && (
              <div className="cd-inperson-badge">
                <span>🤝</span>
                <div>
                  <strong>In-Person Training Available!</strong>
                  <p>This instructor is in your area.</p>
                </div>
              </div>
            )}

            {sameLocation && (
              <a
                href={`mailto:?subject=PicklrZone: In-Person Training with ${course.vendorName}&body=Hi ${course.vendorName}, I found your course "${course.title}" on PicklrZone and I'm interested in in-person training.`}
                className="btn-app btn-app-outline cd-contact-btn"
              >
                <span className="btn-ball">🏓</span>
                Contact for In-Person Training
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
