import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getEnrollments, getCourse } from "../services/api";
import { Course, Enrollment } from "../types";
import StarRating from "../components/StarRating";
import "./MyLearning.css";

interface EnrolledCourse extends Enrollment {
  course?: Course;
}

const MyLearning: React.FC = () => {
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const enrollments: Enrollment[] = await getEnrollments();
        const withCourses = await Promise.all(
          enrollments.map(async (enrollment) => {
            try {
              const course = await getCourse(enrollment.courseId);
              return { ...enrollment, course };
            } catch {
              return { ...enrollment };
            }
          })
        );

        // Deduplicate by courseId — keep only the earliest enrollment per course
        // Also filter out orphaned enrollments where the course no longer exists
        const seen = new Set<string>();
        const unique = withCourses.filter((item) => {
          if (!('course' in item)) return false;
          if (seen.has(item.courseId)) return false;
          seen.add(item.courseId);
          return true;
        });

        setEnrolledCourses(unique);
      } catch (err) {
        console.error("Failed to load enrollments", err);
      }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="ml-loading">
        <span className="bounce-ball">🏓</span>
        <p>Loading your courses...</p>
      </div>
    );
  }

  if (enrolledCourses.length === 0) {
    return (
      <div className="ml-empty">
        <div className="ml-empty-icon">🎓</div>
        <h2>Start Your Pickleball Journey</h2>
        <p>You haven't enrolled in any courses yet. Browse the marketplace and find the perfect course to level up your game!</p>
        <Link to="/courses" className="btn-app btn-app-filled">
          <span className="btn-ball">🏓</span>
          Browse Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="my-learning">
      {/* Header */}
      <div className="ml-header">
        <div>
          <h1>My Learning</h1>
          <p className="ml-subtitle">
            {enrolledCourses.length} course{enrolledCourses.length !== 1 ? "s" : ""} in your library
          </p>
        </div>
        <Link to="/courses" className="btn-app btn-app-outline btn-sm">
          + Add More Courses
        </Link>
      </div>

      {/* Stats bar */}
      <div className="ml-stats-bar">
        <div className="ml-stat">
          <span className="ml-stat-num">{enrolledCourses.length}</span>
          <span className="ml-stat-label">Courses</span>
        </div>
        <div className="ml-stat">
          <span className="ml-stat-num">
            {enrolledCourses.reduce((sum, c) => sum + (c.course?.lessons?.length || 0), 0)}
          </span>
          <span className="ml-stat-label">Total Lessons</span>
        </div>
        <div className="ml-stat">
          <span className="ml-stat-num">
            {enrolledCourses.reduce(
              (sum, c) =>
                sum + (c.course?.lessons?.reduce((s, l) => s + (l.duration || 0), 0) || 0),
              0
            )}
          </span>
          <span className="ml-stat-label">Minutes of Content</span>
        </div>
      </div>

      {/* Course cards */}
      <div className="ml-courses">
        {enrolledCourses.map((item) => {
          const totalLessons = item.course?.lessons?.length || 0;
          const totalDuration =
            item.course?.lessons?.reduce((s, l) => s + (l.duration || 0), 0) || 0;

          return (
            <div key={item.id} className="ml-course-card">
              {/* Thumbnail with overlay */}
              <Link to={`/learn/${item.courseId}`} className="ml-thumb-wrapper">
                <div className="ml-thumb">
                  {item.course?.thumbnailUrl ? (
                    <img src={item.course.thumbnailUrl} alt={item.course.title} />
                  ) : (
                    <div className="ml-thumb-placeholder">🏓</div>
                  )}
                  <div className="ml-thumb-overlay">
                    <div className="ml-play-btn">▶</div>
                    <span>Continue Learning</span>
                  </div>
                </div>
              </Link>

              {/* Info */}
              <div className="ml-course-info">
                <div className="ml-course-top">
                  <div className="ml-course-badges">
                    <span className="ml-badge-level">{item.course?.level}</span>
                    <span className="ml-badge-category">{item.course?.category}</span>
                  </div>

                  <Link to={`/learn/${item.courseId}`} className="ml-course-title">
                    {item.course?.title || item.courseTitle}
                  </Link>

                  <p className="ml-course-vendor">
                    by <strong>{item.course?.vendorName || "Instructor"}</strong>
                    {item.course?.vendorLocation && (
                      <span className="ml-course-loc"> • 📍 {item.course.vendorLocation}</span>
                    )}
                  </p>
                </div>

                <div className="ml-course-middle">
                  {item.course?.shortDescription && (
                    <p className="ml-course-desc">{item.course.shortDescription}</p>
                  )}
                </div>

                <div className="ml-course-bottom">
                  <div className="ml-course-stats">
                    <span>📹 {totalLessons} lessons</span>
                    <span>⏱️ {totalDuration} min</span>
                    {item.course && item.course.averageRating > 0 && (
                      <span className="ml-course-rating">
                        <StarRating rating={item.course.averageRating} size={12} />
                        {item.course.averageRating.toFixed(1)}
                      </span>
                    )}
                  </div>

                  <div className="ml-course-actions">
                    <span className="ml-enrolled-date">
                      Enrolled {new Date(item.purchasedAt).toLocaleDateString()}
                    </span>
                    <Link to={`/learn/${item.courseId}`} className="btn-app btn-app-filled btn-sm">
                      <span className="btn-ball">🏓</span>
                      Start Learning
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MyLearning;
