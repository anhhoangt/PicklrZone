import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getEnrollments, getCourse, getMyBookings, getMySubmissions } from "../services/api";
import { Course, Enrollment, Booking, Submission } from "../types";
import StarRating from "../components/StarRating";
import VideoPlayer from "../components/VideoPlayer";
import "./MyLearning.css";

interface EnrolledCourse extends Enrollment {
  course?: Course;
}

type Tab = "courses" | "activity";

const MyLearning: React.FC = () => {
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("courses");

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
        const seen = new Set<string>();
        const unique = withCourses.filter((item) => {
          if (!('course' in item)) return false;
          if (seen.has(item.courseId)) return false;
          seen.add(item.courseId);
          return true;
        });
        setEnrolledCourses(unique);

        // Load activity data
        const courseIds = unique.map((e) => e.courseId);
        const [allBookings, allSubs] = await Promise.all([
          getMyBookings().catch(() => []),
          Promise.all(courseIds.map((id) => getMySubmissions(id).catch(() => []))),
        ]);
        setBookings(allBookings);
        setSubmissions(allSubs.flat());
      } catch (err) {
        console.error("Failed to load enrollments", err);
      }
      setLoading(false);
    };
    load();
  }, []);

  const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const respondedBookings = bookings.filter((b) => b.status !== "pending");
  const reviewedSubs = submissions.filter((s) => s.status === "reviewed");
  const pendingSubs = submissions.filter((s) => s.status === "pending");

  if (loading) {
    return (
      <div className="ml-loading">
        <span className="bounce-ball">🏓</span>
        <p>Loading your courses...</p>
      </div>
    );
  }

  return (
    <div className="my-learning">
      <div className="ml-header">
        <h1>My Learning</h1>
      </div>

      {/* Stats bar */}
      <div className="ml-stats-bar">
        <div className="ml-stat">
          <span className="ml-stat-num">{enrolledCourses.length}</span>
          <span className="ml-stat-label">Courses</span>
        </div>
        <div className="ml-stat">
          <span className="ml-stat-num">{confirmedBookings.length}</span>
          <span className="ml-stat-label">Sessions Confirmed</span>
        </div>
        <div className="ml-stat">
          <span className="ml-stat-num">{reviewedSubs.length}</span>
          <span className="ml-stat-label">Feedback Received</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="ml-tabs">
        <button
          className={`ml-tab ${tab === "courses" ? "ml-tab-active" : ""}`}
          onClick={() => setTab("courses")}
        >
          🎓 My Courses ({enrolledCourses.length})
        </button>
        <button
          className={`ml-tab ${tab === "activity" ? "ml-tab-active" : ""}`}
          onClick={() => setTab("activity")}
        >
          📋 Activity
          {(pendingBookings.length > 0 || reviewedSubs.length > 0) && (
            <span className="ml-tab-badge">
              {pendingBookings.length + reviewedSubs.length}
            </span>
          )}
        </button>
      </div>

      {/* ===== COURSES TAB ===== */}
      {tab === "courses" && (
        <>
          {enrolledCourses.length === 0 ? (
            <div className="ml-empty">
              <div className="ml-empty-icon">🎓</div>
              <h2>Start Your Pickleball Journey</h2>
              <p>You haven't enrolled in any courses yet. Browse the marketplace and find the perfect course to level up your game!</p>
              <Link to="/courses" className="btn-app btn-app-filled">
                <span className="btn-ball">🏓</span>
                Browse Courses
              </Link>
            </div>
          ) : (
            <div className="ml-courses">
              {enrolledCourses.map((item) => {
                const totalLessons = item.course?.lessons?.length || 0;
                const totalDuration =
                  item.course?.lessons?.reduce((s, l) => s + (l.duration || 0), 0) || 0;

                return (
                  <div key={item.id} className="ml-course-card">
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
                        <Link to={`/learn/${item.courseId}`} className="btn-app btn-app-filled btn-sm">
                          <span className="btn-ball">🏓</span>
                          Start Learning
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ===== ACTIVITY TAB ===== */}
      {tab === "activity" && (
        <div className="ml-activity">
          {bookings.length === 0 && submissions.length === 0 ? (
            <div className="ml-empty">
              <span className="ml-empty-icon">📋</span>
              <h2>No Activity Yet</h2>
              <p>Book a training session or submit a practice video in any course to see your activity here.</p>
            </div>
          ) : (
            <>
              {/* Bookings */}
              {bookings.length > 0 && (
                <div className="ml-activity-section">
                  <h2>📅 Training Sessions</h2>

                  {pendingBookings.length > 0 && (
                    <div className="ml-act-group">
                      <h3>⏳ Awaiting Response ({pendingBookings.length})</h3>
                      {pendingBookings.map((b) => (
                        <div key={b.id} className="ml-act-card ml-act-pending">
                          <div className="ml-act-top">
                            <div>
                              <span className="ml-act-course">{b.courseTitle}</span>
                              <span className="ml-act-sub">with {b.vendorName}</span>
                            </div>
                            <span className="ml-act-badge ml-act-badge-pending">⏳ Pending</span>
                          </div>
                          <div className="ml-act-details">
                            <p>🕐 {new Date(b.requestedDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{b.requestedEndTime ? ` — ${new Date(b.requestedEndTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}{b.requestedEndTime ? ` (${Math.round((new Date(b.requestedEndTime).getTime() - new Date(b.requestedDate).getTime()) / 60000)} min)` : ""} • {new Date(b.requestedDate).toLocaleDateString()}</p>
                            <p>💬 {b.message}</p>
                          </div>
                          {b.vendorResponse && (
                            <div className={`ml-act-response ml-act-response-${b.status}`}>
                              <strong>{b.status === "confirmed" ? "🎉" : "💬"} Instructor:</strong>
                              <p>{b.vendorResponse}</p>
                            </div>
                          )}
                          {b.status === "confirmed" && !b.vendorResponse && (
                            <div className="ml-act-response ml-act-response-confirmed">
                              <strong>🎉 Confirmed!</strong>
                              <p>Your training session is confirmed. Get ready!</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {respondedBookings.length > 0 && (
                <div className="ml-activity-section">
                  <h2>📋 Responded Sessions</h2>
                  <div className="ml-act-group">
                    {respondedBookings.map((b) => (
                      <div key={b.id} className={`ml-act-card ml-act-${b.status}`}>
                        <div className="ml-act-top">
                          <div>
                            <span className="ml-act-course">{b.courseTitle}</span>
                            <span className="ml-act-sub">with {b.vendorName}</span>
                          </div>
                          <span className={`ml-act-badge ml-act-badge-${b.status}`}>
                            {b.status === "confirmed" ? "✅ Confirmed" : "❌ Declined"}
                          </span>
                        </div>
                        <div className="ml-act-details">
                          <p>🕐 {new Date(b.requestedDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{b.requestedEndTime ? ` — ${new Date(b.requestedEndTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}{b.requestedEndTime ? ` (${Math.round((new Date(b.requestedEndTime).getTime() - new Date(b.requestedDate).getTime()) / 60000)} min)` : ""} • {new Date(b.requestedDate).toLocaleDateString()}</p>
                          <p>💬 {b.message}</p>
                        </div>
                        {b.vendorResponse && (
                          <div className={`ml-act-response ml-act-response-${b.status}`}>
                            <strong>{b.status === "confirmed" ? "🎉" : "💬"} Instructor:</strong>
                            <p>{b.vendorResponse}</p>
                          </div>
                        )}
                        {b.status === "confirmed" && !b.vendorResponse && (
                          <div className="ml-act-response ml-act-response-confirmed">
                            <strong>🎉 Confirmed!</strong>
                            <p>Your training session is confirmed. Get ready!</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submissions */}
              {submissions.length > 0 && (
                <div className="ml-activity-section">
                  <h2>🎥 Video Submissions</h2>

                  {reviewedSubs.length > 0 && (
                    <div className="ml-act-group">
                      <h3>✅ Feedback Received ({reviewedSubs.length})</h3>
                      {reviewedSubs.map((sub) => (
                        <div key={sub.id} className="ml-act-card ml-act-reviewed">
                          <div className="ml-act-top">
                            <div>
                              <span className="ml-act-course">{sub.courseTitle}</span>
                              <span className="ml-act-sub">Submitted {new Date(sub.createdAt).toLocaleDateString()}</span>
                            </div>
                            <span className="ml-act-badge ml-act-badge-reviewed">✅ Reviewed</span>
                          </div>
                          <div className="ml-act-video">
                            <VideoPlayer url={sub.videoUrl} title="Your submission" />
                          </div>
                          {sub.notes && <p className="ml-act-notes">📝 {sub.notes}</p>}
                          <div className="ml-act-feedback">
                            <div className="ml-act-fb-header">
                              <strong>🏆 Instructor Feedback</strong>
                              {sub.vendorRating && (
                                <div className="ml-act-fb-rating">
                                  <StarRating rating={sub.vendorRating} size={14} />
                                  <span>{sub.vendorRating}/5</span>
                                </div>
                              )}
                            </div>
                            <p>{sub.vendorFeedback}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {pendingSubs.length > 0 && (
                    <div className="ml-act-group">
                      <h3>⏳ Awaiting Review ({pendingSubs.length})</h3>
                      {pendingSubs.map((sub) => (
                        <div key={sub.id} className="ml-act-card ml-act-pending">
                          <div className="ml-act-top">
                            <div>
                              <span className="ml-act-course">{sub.courseTitle}</span>
                              <span className="ml-act-sub">Submitted {new Date(sub.createdAt).toLocaleDateString()}</span>
                            </div>
                            <span className="ml-act-badge ml-act-badge-pending">⏳ Pending</span>
                          </div>
                          {sub.notes && <p className="ml-act-notes">📝 {sub.notes}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MyLearning;
