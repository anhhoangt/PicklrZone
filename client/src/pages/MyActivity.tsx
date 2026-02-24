import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyBookings, getMySubmissions, getEnrollments } from "../services/api";
import { Booking, Submission } from "../types";
import StarRating from "../components/StarRating";
import VideoPlayer from "../components/VideoPlayer";
import "./MyActivity.css";

type Tab = "bookings" | "submissions";

const MyActivity: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("bookings");

  useEffect(() => {
    const load = async () => {
      try {
        const enrollments = await getEnrollments();
        const courseIds = enrollments.map((e: any) => e.courseId);

        const [allBookings, allSubs] = await Promise.all([
          getMyBookings().catch(() => []),
          Promise.all(
            courseIds.map((id: string) => getMySubmissions(id).catch(() => []))
          ),
        ]);

        setBookings(allBookings);
        setSubmissions(allSubs.flat());
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const respondedBookings = bookings.filter((b) => b.status !== "pending");
  const reviewedSubs = submissions.filter((s) => s.status === "reviewed");
  const pendingSubs = submissions.filter((s) => s.status === "pending");

  if (loading) {
    return (
      <div className="ma-loading">
        <span className="bounce-ball">🏓</span>
        <p>Loading your activity...</p>
      </div>
    );
  }

  return (
    <div className="my-activity">
      <h1>My Activity</h1>
      <p className="ma-subtitle">Track your training sessions and video submissions</p>

      {/* Summary cards */}
      <div className="ma-summary">
        <div className="ma-summary-card">
          <span className="ma-summary-num">{bookings.length}</span>
          <span className="ma-summary-label">Sessions Requested</span>
        </div>
        <div className="ma-summary-card ma-summary-highlight">
          <span className="ma-summary-num">{bookings.filter((b) => b.status === "confirmed").length}</span>
          <span className="ma-summary-label">Confirmed</span>
        </div>
        <div className="ma-summary-card">
          <span className="ma-summary-num">{submissions.length}</span>
          <span className="ma-summary-label">Videos Submitted</span>
        </div>
        <div className="ma-summary-card ma-summary-highlight">
          <span className="ma-summary-num">{reviewedSubs.length}</span>
          <span className="ma-summary-label">Feedback Received</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="ma-tabs">
        <button
          className={`ma-tab ${tab === "bookings" ? "ma-tab-active" : ""}`}
          onClick={() => setTab("bookings")}
        >
          📅 Training Sessions
          {pendingBookings.length > 0 && <span className="ma-tab-badge">{pendingBookings.length}</span>}
        </button>
        <button
          className={`ma-tab ${tab === "submissions" ? "ma-tab-active" : ""}`}
          onClick={() => setTab("submissions")}
        >
          🎥 Video Submissions
          {reviewedSubs.length > 0 && <span className="ma-tab-badge ma-tab-badge-green">{reviewedSubs.length}</span>}
        </button>
      </div>

      {/* Bookings tab */}
      {tab === "bookings" && (
        <div className="ma-content">
          {bookings.length === 0 ? (
            <div className="ma-empty">
              <span>📅</span>
              <p>No training sessions booked yet.</p>
              <Link to="/my-learning" className="btn-app btn-app-outline btn-sm">
                Go to My Learning
              </Link>
            </div>
          ) : (
            <>
              {pendingBookings.length > 0 && (
                <div className="ma-group">
                  <h2>⏳ Awaiting Response ({pendingBookings.length})</h2>
                  {pendingBookings.map((b) => (
                    <div key={b.id} className="ma-card ma-card-pending">
                      <div className="ma-card-top">
                        <div>
                          <span className="ma-card-course">{b.courseTitle}</span>
                          <span className="ma-card-vendor">with {b.vendorName}</span>
                        </div>
                        <span className="ma-badge ma-badge-pending">⏳ Pending</span>
                      </div>
                      <div className="ma-card-details">
                        <p>📅 {new Date(b.requestedDate).toLocaleDateString()} at {new Date(b.requestedDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                        <p>💬 {b.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {respondedBookings.length > 0 && (
                <div className="ma-group">
                  <h2>📋 Responded ({respondedBookings.length})</h2>
                  {respondedBookings.map((b) => (
                    <div key={b.id} className={`ma-card ma-card-${b.status}`}>
                      <div className="ma-card-top">
                        <div>
                          <span className="ma-card-course">{b.courseTitle}</span>
                          <span className="ma-card-vendor">with {b.vendorName}</span>
                        </div>
                        <span className={`ma-badge ma-badge-${b.status}`}>
                          {b.status === "confirmed" ? "✅ Confirmed" : "❌ Declined"}
                        </span>
                      </div>
                      <div className="ma-card-details">
                        <p>📅 {new Date(b.requestedDate).toLocaleDateString()} at {new Date(b.requestedDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                        <p>💬 {b.message}</p>
                      </div>
                      {b.vendorResponse && (
                        <div className={`ma-response ma-response-${b.status}`}>
                          <strong>{b.status === "confirmed" ? "🎉" : "💬"} Instructor Response:</strong>
                          <p>{b.vendorResponse}</p>
                        </div>
                      )}
                      {b.status === "confirmed" && !b.vendorResponse && (
                        <div className="ma-response ma-response-confirmed">
                          <strong>🎉 Session Confirmed!</strong>
                          <p>Your instructor confirmed the training session. Get ready to level up!</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Submissions tab */}
      {tab === "submissions" && (
        <div className="ma-content">
          {submissions.length === 0 ? (
            <div className="ma-empty">
              <span>🎥</span>
              <p>No video submissions yet.</p>
              <Link to="/my-learning" className="btn-app btn-app-outline btn-sm">
                Go to My Learning
              </Link>
            </div>
          ) : (
            <>
              {reviewedSubs.length > 0 && (
                <div className="ma-group">
                  <h2>✅ Feedback Received ({reviewedSubs.length})</h2>
                  {reviewedSubs.map((sub) => (
                    <div key={sub.id} className="ma-card ma-card-reviewed">
                      <div className="ma-card-top">
                        <div>
                          <span className="ma-card-course">{sub.courseTitle}</span>
                          <span className="ma-card-date">
                            Submitted {new Date(sub.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="ma-badge ma-badge-reviewed">✅ Reviewed</span>
                      </div>
                      <div className="ma-sub-video">
                        <VideoPlayer url={sub.videoUrl} title="Your submission" />
                      </div>
                      {sub.notes && <p className="ma-sub-notes">📝 {sub.notes}</p>}
                      <div className="ma-feedback">
                        <div className="ma-feedback-header">
                          <strong>🏆 Instructor Feedback</strong>
                          {sub.vendorRating && (
                            <div className="ma-feedback-rating">
                              <StarRating rating={sub.vendorRating} size={16} />
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
                <div className="ma-group">
                  <h2>⏳ Awaiting Review ({pendingSubs.length})</h2>
                  {pendingSubs.map((sub) => (
                    <div key={sub.id} className="ma-card ma-card-pending">
                      <div className="ma-card-top">
                        <div>
                          <span className="ma-card-course">{sub.courseTitle}</span>
                          <span className="ma-card-date">
                            Submitted {new Date(sub.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="ma-badge ma-badge-pending">⏳ Pending</span>
                      </div>
                      <div className="ma-sub-video">
                        <VideoPlayer url={sub.videoUrl} title="Your submission" />
                      </div>
                      {sub.notes && <p className="ma-sub-notes">📝 {sub.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MyActivity;
