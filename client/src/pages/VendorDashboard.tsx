import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCourses, deleteCourse, getUserProfile } from "../services/api";
import { Course } from "../types";
import { useAuth } from "../contexts/AuthContext";
import StarRating from "../components/StarRating";
import "./VendorDashboard.css";

const VendorDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVendor, setIsVendor] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await getUserProfile();
        if (profile.role !== "vendor") {
          setIsVendor(false);
          setLoading(false);
          return;
        }
        setIsVendor(true);

        const allCourses = await getCourses();
        setCourses(allCourses.filter((c) => c.vendorId === currentUser?.uid));
      } catch (err) {
        console.error("Failed to load vendor data", err);
      }
      setLoading(false);
    };
    load();
  }, [currentUser]);

  const handleDelete = async (courseId: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(courseId);
    try {
      await deleteCourse(courseId);
      setCourses(courses.filter((c) => c.id !== courseId));
    } catch (err) {
      console.error("Failed to delete course", err);
    }
    setDeleting(null);
  };

  if (loading) {
    return (
      <div className="vendor-loading">
        <span className="bounce-ball">🏓</span>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isVendor) {
    return (
      <div className="vendor-not-vendor">
        <span>🏓</span>
        <h2>Become a Vendor</h2>
        <p>
          You need to set your role to <strong>Vendor</strong> in your profile
          to create and sell courses.
        </p>
        <Link to="/profile" className="btn-app btn-app-filled">
          <span className="btn-ball">🏓</span>
          Go to Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="vendor-dashboard">
      <div className="vendor-header">
        <div>
          <h1>My Courses</h1>
          <p>{courses.length} course{courses.length !== 1 ? "s" : ""} published</p>
        </div>
        <Link to="/vendor/courses/new" className="btn-app btn-app-filled">
          <span className="btn-ball">🏓</span>
          Add New Course
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="vendor-empty">
          <span>🏓</span>
          <h3>No courses yet</h3>
          <p>Start sharing your pickleball expertise!</p>
          <Link to="/vendor/courses/new" className="btn-app btn-app-filled">
            <span className="btn-ball">🏓</span>
            Create Your First Course
          </Link>
        </div>
      ) : (
        <div className="vendor-course-list">
          {courses.map((course) => (
            <div key={course.id} className="vendor-course-item">
              <div className="vendor-course-thumb">
                {course.thumbnailUrl ? (
                  <img src={course.thumbnailUrl} alt="" />
                ) : (
                  <div className="vendor-course-thumb-placeholder">🏓</div>
                )}
              </div>

              <div className="vendor-course-info">
                <h3>{course.title}</h3>
                <p>{course.shortDescription}</p>
                <div className="vendor-course-stats">
                  <span>
                    <StarRating rating={course.averageRating} size={12} />
                    {" "}{course.averageRating > 0 ? course.averageRating.toFixed(1) : "—"}
                  </span>
                  <span>{course.totalReviews} reviews</span>
                  <span>{course.totalStudents} students</span>
                  <span className="vendor-course-price">
                    {course.price === 0 ? "Free" : `$${course.price.toFixed(2)}`}
                  </span>
                </div>
              </div>

              <div className="vendor-course-actions">
                <button
                  onClick={() => navigate(`/vendor/courses/${course.id}/edit`)}
                  className="btn-app btn-app-outline btn-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(course.id, course.title)}
                  className="btn-app btn-danger btn-sm"
                  disabled={deleting === course.id}
                >
                  {deleting === course.id ? "..." : "Delete"}
                </button>
                <Link
                  to={`/courses/${course.id}`}
                  className="btn-app btn-app-outline btn-sm"
                >
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorDashboard;
