import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCourses, deleteCourse, getUserProfile, getVendorSubmissions, evaluateSubmission, getVendorBookings, respondToBooking } from "../services/api";
import { Course, Submission, Booking } from "../types";
import { useAuth } from "../contexts/AuthContext";
import StarRating from "../components/StarRating";
import VideoPlayer from "../components/VideoPlayer";
import "./VendorDashboard.css";

type Tab = "courses" | "reviews" | "schedule";

function timeBlocksOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  const a0 = new Date(startA).getTime();
  const a1 = new Date(endA).getTime();
  const b0 = new Date(startB).getTime();
  const b1 = new Date(endB).getTime();
  return a0 < b1 && b0 < a1;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString();
}

const VendorDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVendor, setIsVendor] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("courses");

  const [evalId, setEvalId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(0);
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalError, setEvalError] = useState("");

  const [respondId, setRespondId] = useState<string | null>(null);
  const [response, setResponse] = useState("");
  const [respondLoading, setRespondLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await getUserProfile();
        if (profile.role !== "vendor") { setIsVendor(false); setLoading(false); return; }
        setIsVendor(true);
        const allCourses = await getCourses();
        setCourses(allCourses.filter((c) => c.vendorId === currentUser?.uid));
        const [subs, books] = await Promise.all([
          getVendorSubmissions().catch(() => []),
          getVendorBookings().catch(() => []),
        ]);
        setSubmissions(subs);
        setBookings(books);
      } catch (err) { console.error("Failed to load vendor data", err); }
      setLoading(false);
    };
    load();
  }, [currentUser]);

  const handleDelete = async (courseId: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(courseId);
    try { await deleteCourse(courseId); setCourses(courses.filter((c) => c.id !== courseId)); } catch {}
    setDeleting(null);
  };

  const handleEvaluate = async (submissionId: string) => {
    if (!feedback.trim()) { setEvalError("Feedback is required"); return; }
    setEvalLoading(true); setEvalError("");
    try {
      const updated = await evaluateSubmission(submissionId, { vendorFeedback: feedback, vendorRating: rating || undefined });
      setSubmissions(submissions.map((s) => (s.id === submissionId ? updated : s)));
      setEvalId(null); setFeedback(""); setRating(0);
    } catch (err: any) { setEvalError(err.message || "Failed to evaluate"); }
    setEvalLoading(false);
  };

  const handleBookingResponse = async (bookingId: string, status: "confirmed" | "declined") => {
    setRespondLoading(true);
    try {
      const updated = await respondToBooking(bookingId, { status, vendorResponse: response });
      setBookings(bookings.map((b) => (b.id === bookingId ? updated : b)));
      setRespondId(null); setResponse("");
    } catch {}
    setRespondLoading(false);
  };

  if (loading) {
    return <div className="vendor-loading"><span className="bounce-ball">🏓</span><p>Loading...</p></div>;
  }

  if (!isVendor) {
    return (
      <div className="vendor-not-vendor">
        <span>🏓</span><h2>Become a Vendor</h2>
        <p>You need to set your role to <strong>Vendor</strong> in your profile to create and sell courses.</p>
        <Link to="/profile" className="btn-app btn-app-filled"><span className="btn-ball">🏓</span>Go to Profile</Link>
      </div>
    );
  }

  const pendingSubs = submissions.filter((s) => s.status === "pending");
  const reviewedSubs = submissions.filter((s) => s.status === "reviewed");

  // Schedule data
  const confirmedBooks = bookings.filter((b) => b.status === "confirmed");
  const pendingBooks = bookings.filter((b) => b.status === "pending");
  const declinedBooks = bookings.filter((b) => b.status === "declined");

  const allActive = [...confirmedBooks, ...pendingBooks].sort(
    (a, b) => new Date(a.requestedDate).getTime() - new Date(b.requestedDate).getTime()
  );
  const now = new Date();
  const upcomingActive = allActive.filter((b) => new Date(b.requestedDate) >= now);
  const pastConfirmed = confirmedBooks
    .filter((b) => new Date(b.requestedDate) < now)
    .sort((a, b) => new Date(b.requestedDate).getTime() - new Date(a.requestedDate).getTime());

  // Check if a booking overlaps with any confirmed session
  const getOverlaps = (booking: Booking): Booking[] => {
    return confirmedBooks.filter(
      (c) =>
        c.id !== booking.id &&
        booking.requestedEndTime &&
        c.requestedEndTime &&
        timeBlocksOverlap(booking.requestedDate, booking.requestedEndTime, c.requestedDate, c.requestedEndTime)
    );
  };

  return (
    <div className="vendor-dashboard">
      <div className="vendor-header"><h1>My Courses</h1></div>

      <div className="vd-tabs">
        <button className={`vd-tab ${tab === "courses" ? "vd-tab-active" : ""}`} onClick={() => setTab("courses")}>
          🏪 Courses ({courses.length})
        </button>
        <button className={`vd-tab ${tab === "reviews" ? "vd-tab-active" : ""}`} onClick={() => setTab("reviews")}>
          🎥 Student Reviews
          {pendingSubs.length > 0 && <span className="vd-tab-badge">{pendingSubs.length}</span>}
        </button>
        <button className={`vd-tab ${tab === "schedule" ? "vd-tab-active" : ""}`} onClick={() => setTab("schedule")}>
          📅 Schedule
          {(confirmedBooks.length + pendingBooks.length) > 0 && (
            <span className="vd-tab-badge vd-tab-badge-green">{confirmedBooks.length + pendingBooks.length}</span>
          )}
        </button>
      </div>

      {/* ===== COURSES TAB ===== */}
      {tab === "courses" && (
        <>
          <div className="vendor-courses-header">
            <p>{courses.length} course{courses.length !== 1 ? "s" : ""} published</p>
            <Link to="/vendor/courses/new" className="btn-app btn-app-filled"><span className="btn-ball">🏓</span>Add New Course</Link>
          </div>
          {courses.length === 0 ? (
            <div className="vendor-empty">
              <span>🏓</span><h3>No courses yet</h3><p>Start sharing your pickleball expertise!</p>
              <Link to="/vendor/courses/new" className="btn-app btn-app-filled"><span className="btn-ball">🏓</span>Create Your First Course</Link>
            </div>
          ) : (
            <div className="vendor-course-list">
              {courses.map((course) => (
                <div key={course.id} className="vendor-course-item">
                  <div className="vendor-course-thumb">
                    {course.thumbnailUrl ? <img src={course.thumbnailUrl} alt="" /> : <div className="vendor-course-thumb-placeholder">🏓</div>}
                  </div>
                  <div className="vendor-course-info">
                    <h3>{course.title}</h3>
                    <p>{course.shortDescription}</p>
                    <div className="vendor-course-stats">
                      <span><StarRating rating={course.averageRating} size={12} /> {course.averageRating > 0 ? course.averageRating.toFixed(1) : "—"}</span>
                      <span>{course.totalReviews} reviews</span>
                      <span>{course.totalStudents} students</span>
                      <span className="vendor-course-price">{course.price === 0 ? "Free" : `$${course.price.toFixed(2)}`}</span>
                    </div>
                  </div>
                  <div className="vendor-course-actions">
                    <button onClick={() => navigate(`/vendor/courses/${course.id}/edit`)} className="btn-app btn-app-outline btn-sm">Edit</button>
                    <button onClick={() => handleDelete(course.id, course.title)} className="btn-app btn-danger btn-sm" disabled={deleting === course.id}>{deleting === course.id ? "..." : "Delete"}</button>
                    <Link to={`/courses/${course.id}`} className="btn-app btn-app-outline btn-sm">View</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ===== STUDENT REVIEWS TAB (submissions only) ===== */}
      {tab === "reviews" && (
        <div className="vd-reviews">
          {submissions.length === 0 ? (
            <div className="vendor-empty"><span>🎥</span><h3>No student submissions yet</h3><p>When students submit practice videos, they'll appear here for evaluation.</p></div>
          ) : (
            <>
              {pendingSubs.length > 0 && (
                <div className="vd-review-group">
                  <h2>🎥 Pending Review ({pendingSubs.length})</h2>
                  {pendingSubs.map((sub) => (
                    <div key={sub.id} className="vd-review-card vd-card-pending">
                      <div className="vd-card-top">
                        <div><span className="vd-student-name">{sub.userName}</span><span className="vd-course-name">{sub.courseTitle}</span></div>
                        <span className="vd-badge vd-badge-pending">⏳ Pending</span>
                      </div>
                      <div className="vd-card-video"><VideoPlayer url={sub.videoUrl} title={`${sub.userName}'s submission`} /></div>
                      {sub.notes && <p className="vd-card-notes">📝 {sub.notes}</p>}
                      {evalId === sub.id ? (
                        <div className="vd-eval-form">
                          {evalError && <div className="vd-error">{evalError}</div>}
                          <div className="vd-eval-rating"><span>Rate Performance:</span><StarRating rating={rating} interactive onRate={setRating} size={22} /></div>
                          <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Provide detailed feedback..." rows={4} />
                          <div className="vd-eval-actions">
                            <button onClick={() => handleEvaluate(sub.id)} className="btn-app btn-app-filled" disabled={evalLoading}><span className="btn-ball">🏓</span>{evalLoading ? "Submitting..." : "Submit Evaluation"}</button>
                            <button onClick={() => { setEvalId(null); setFeedback(""); setRating(0); }} className="btn-app btn-app-outline">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setEvalId(sub.id)} className="btn-app btn-app-filled btn-sm"><span className="btn-ball">🏓</span>Evaluate</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {reviewedSubs.length > 0 && (
                <div className="vd-review-group">
                  <h2>✅ Reviewed ({reviewedSubs.length})</h2>
                  {reviewedSubs.map((sub) => (
                    <div key={sub.id} className="vd-review-card vd-card-reviewed">
                      <div className="vd-card-top">
                        <div><span className="vd-student-name">{sub.userName}</span><span className="vd-course-name">{sub.courseTitle}</span></div>
                        <span className="vd-badge vd-badge-reviewed">✅ Reviewed</span>
                      </div>
                      <div className="vd-card-video"><VideoPlayer url={sub.videoUrl} title={`${sub.userName}'s submission`} /></div>
                      <div className="vd-feedback-box">
                        <strong>Your Feedback:</strong>
                        {sub.vendorRating && <div className="vd-fb-rating"><StarRating rating={sub.vendorRating} size={14} /><span>{sub.vendorRating}/5</span></div>}
                        <p>{sub.vendorFeedback}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ===== SCHEDULE TAB (bookings + overlap detection) ===== */}
      {tab === "schedule" && (
        <div className="vd-schedule">
          {allActive.length === 0 && pastConfirmed.length === 0 && declinedBooks.length === 0 ? (
            <div className="vendor-empty">
              <span>📅</span><h3>No Sessions Yet</h3>
              <p>When students book training sessions, they'll appear here. Confirmed sessions show your schedule.</p>
            </div>
          ) : (
            <>
              {/* Upcoming: pending + confirmed mixed */}
              {upcomingActive.length > 0 && (
                <div className="vd-schedule-group">
                  <h2>📅 Upcoming ({upcomingActive.length})</h2>
                  {upcomingActive.map((b) => {
                    const date = new Date(b.requestedDate);
                    const overlaps = b.status === "pending" ? getOverlaps(b) : [];
                    const hasOverlap = overlaps.length > 0;
                    const startMs = new Date(b.requestedDate).getTime();
                    const endMs = b.requestedEndTime ? new Date(b.requestedEndTime).getTime() : 0;
                    const durationMin = endMs ? Math.round((endMs - startMs) / 60000) : 0;

                    return (
                      <div key={b.id} className={`vd-schedule-card ${b.status === "confirmed" ? "vd-schedule-confirmed" : "vd-schedule-pending"} ${hasOverlap ? "vd-schedule-overlap" : ""}`}>
                        <div className="vd-schedule-date-col">
                          <span className="vd-schedule-month">{date.toLocaleDateString(undefined, { month: "short" })}</span>
                          <span className="vd-schedule-day">{date.getDate()}</span>
                          <div className="vd-schedule-timerange">
                            <span className="vd-schedule-start">{formatTime(b.requestedDate)}</span>
                            {b.requestedEndTime && (
                              <>
                                <span className="vd-schedule-arrow">↓</span>
                                <span className="vd-schedule-end">{formatTime(b.requestedEndTime)}</span>
                              </>
                            )}
                          </div>
                          {durationMin > 0 && <span className="vd-schedule-duration">{durationMin} min</span>}
                        </div>

                        <div className="vd-schedule-info">
                          <div className="vd-schedule-info-top">
                            <div>
                              <span className="vd-schedule-student">🎓 {b.userName}</span>
                              <span className="vd-schedule-course">{b.courseTitle}</span>
                            </div>
                            <span className={`vd-schedule-status vd-schedule-status-${b.status}`}>
                              {b.status === "confirmed" ? "✅ Confirmed" : "⏳ Pending"}
                            </span>
                          </div>

                          <div className="vd-schedule-time-block">
                            🕐 {formatTime(b.requestedDate)}
                            {b.requestedEndTime ? ` — ${formatTime(b.requestedEndTime)}` : ""}
                            {durationMin > 0 ? ` (${durationMin} min)` : ""}
                            {" • "}{formatDate(b.requestedDate)}
                          </div>

                          <p className="vd-schedule-msg">💬 {b.message}</p>

                          {hasOverlap && (
                            <div className="vd-overlap-warning">
                              ⚠️ <strong>Overlap detected!</strong> Conflicts with:{" "}
                              {overlaps.map((o) => (
                                <span key={o.id}>{o.userName} ({formatTime(o.requestedDate)} — {o.requestedEndTime ? formatTime(o.requestedEndTime) : "?"})</span>
                              ))}
                            </div>
                          )}

                          {b.vendorResponse && <p className="vd-schedule-response">📝 Your note: {b.vendorResponse}</p>}

                          {/* Respond to pending */}
                          {b.status === "pending" && (
                            respondId === b.id ? (
                              <div className="vd-respond-form">
                                <textarea value={response} onChange={(e) => setResponse(e.target.value)} placeholder="Optional message to the student..." rows={2} />
                                <div className="vd-respond-actions">
                                  <button onClick={() => handleBookingResponse(b.id, "confirmed")} className="btn-app btn-app-filled btn-sm" disabled={respondLoading}>✅ Confirm</button>
                                  <button onClick={() => handleBookingResponse(b.id, "declined")} className="btn-app btn-danger btn-sm" disabled={respondLoading}>❌ Decline</button>
                                  <button onClick={() => { setRespondId(null); setResponse(""); }} className="btn-app btn-app-outline btn-sm">Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <button onClick={() => setRespondId(b.id)} className="btn-app btn-app-outline btn-sm" style={{ marginTop: 8 }}>Respond</button>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Past confirmed */}
              {pastConfirmed.length > 0 && (
                <div className="vd-schedule-group">
                  <h2>✅ Past Sessions ({pastConfirmed.length})</h2>
                  {pastConfirmed.map((b) => {
                    const date = new Date(b.requestedDate);
                    const startMs = new Date(b.requestedDate).getTime();
                    const endMs = b.requestedEndTime ? new Date(b.requestedEndTime).getTime() : 0;
                    const durationMin = endMs ? Math.round((endMs - startMs) / 60000) : 0;
                    return (
                      <div key={b.id} className="vd-schedule-card vd-schedule-past">
                        <div className="vd-schedule-date-col">
                          <span className="vd-schedule-month">{date.toLocaleDateString(undefined, { month: "short" })}</span>
                          <span className="vd-schedule-day">{date.getDate()}</span>
                          <div className="vd-schedule-timerange">
                            <span className="vd-schedule-start">{formatTime(b.requestedDate)}</span>
                            {b.requestedEndTime && (
                              <>
                                <span className="vd-schedule-arrow">↓</span>
                                <span className="vd-schedule-end">{formatTime(b.requestedEndTime)}</span>
                              </>
                            )}
                          </div>
                          {durationMin > 0 && <span className="vd-schedule-duration">{durationMin} min</span>}
                        </div>
                        <div className="vd-schedule-info">
                          <span className="vd-schedule-student">🎓 {b.userName}</span>
                          <span className="vd-schedule-course">{b.courseTitle}</span>
                          <div className="vd-schedule-time-block">
                            🕐 {formatTime(b.requestedDate)}
                            {b.requestedEndTime ? ` — ${formatTime(b.requestedEndTime)}` : ""}
                            {durationMin > 0 ? ` (${durationMin} min)` : ""}
                          </div>
                          <p className="vd-schedule-msg">💬 {b.message}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default VendorDashboard;
