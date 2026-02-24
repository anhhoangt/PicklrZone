import React, { useEffect, useState } from "react";
import { getVendorSubmissions, evaluateSubmission, getVendorBookings, respondToBooking } from "../services/api";
import { Submission, Booking } from "../types";
import VideoPlayer from "../components/VideoPlayer";
import StarRating from "../components/StarRating";
import "./VendorReviews.css";

const VendorReviews: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"submissions" | "bookings">("submissions");

  // Evaluation form state
  const [evalId, setEvalId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(0);
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalError, setEvalError] = useState("");

  // Booking response state
  const [respondId, setRespondId] = useState<string | null>(null);
  const [response, setResponse] = useState("");
  const [respondLoading, setRespondLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [subs, books] = await Promise.all([
          getVendorSubmissions().catch(() => []),
          getVendorBookings().catch(() => []),
        ]);
        setSubmissions(subs);
        setBookings(books);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const handleEvaluate = async (submissionId: string) => {
    if (!feedback.trim()) {
      setEvalError("Feedback is required");
      return;
    }
    setEvalLoading(true);
    setEvalError("");
    try {
      const updated = await evaluateSubmission(submissionId, {
        vendorFeedback: feedback,
        vendorRating: rating || undefined,
      });
      setSubmissions(submissions.map((s) => (s.id === submissionId ? updated : s)));
      setEvalId(null);
      setFeedback("");
      setRating(0);
    } catch (err: any) {
      setEvalError(err.message || "Failed to evaluate");
    }
    setEvalLoading(false);
  };

  const handleBookingResponse = async (bookingId: string, status: "confirmed" | "declined") => {
    setRespondLoading(true);
    try {
      const updated = await respondToBooking(bookingId, {
        status,
        vendorResponse: response,
      });
      setBookings(bookings.map((b) => (b.id === bookingId ? updated : b)));
      setRespondId(null);
      setResponse("");
    } catch {}
    setRespondLoading(false);
  };

  if (loading) {
    return (
      <div className="vr-loading">
        <span className="bounce-ball">🏓</span>
        <p>Loading...</p>
      </div>
    );
  }

  const pendingSubs = submissions.filter((s) => s.status === "pending");
  const reviewedSubs = submissions.filter((s) => s.status === "reviewed");
  const pendingBooks = bookings.filter((b) => b.status === "pending");

  return (
    <div className="vendor-reviews">
      <h1>Student Submissions & Bookings</h1>

      <div className="vr-tabs">
        <button
          className={`vr-tab ${tab === "submissions" ? "vr-tab-active" : ""}`}
          onClick={() => setTab("submissions")}
        >
          🎥 Submissions
          {pendingSubs.length > 0 && <span className="vr-tab-badge">{pendingSubs.length}</span>}
        </button>
        <button
          className={`vr-tab ${tab === "bookings" ? "vr-tab-active" : ""}`}
          onClick={() => setTab("bookings")}
        >
          📅 Bookings
          {pendingBooks.length > 0 && <span className="vr-tab-badge">{pendingBooks.length}</span>}
        </button>
      </div>

      {/* Submissions tab */}
      {tab === "submissions" && (
        <div className="vr-content">
          {submissions.length === 0 ? (
            <div className="vr-empty">
              <span>🎥</span>
              <p>No student submissions yet.</p>
            </div>
          ) : (
            <>
              {pendingSubs.length > 0 && (
                <div className="vr-group">
                  <h2>⏳ Pending Review ({pendingSubs.length})</h2>
                  {pendingSubs.map((sub) => (
                    <div key={sub.id} className="vr-card vr-card-pending">
                      <div className="vr-card-header">
                        <div>
                          <span className="vr-student-name">{sub.userName}</span>
                          <span className="vr-course-name">{sub.courseTitle}</span>
                        </div>
                        <span className="vr-date">{new Date(sub.createdAt).toLocaleDateString()}</span>
                      </div>

                      <div className="vr-video">
                        <VideoPlayer url={sub.videoUrl} title={`${sub.userName}'s submission`} />
                      </div>

                      {sub.notes && <p className="vr-notes">📝 {sub.notes}</p>}

                      {evalId === sub.id ? (
                        <div className="vr-eval-form">
                          {evalError && <div className="cl-error">{evalError}</div>}
                          <div className="vr-eval-rating">
                            <span>Rate Performance:</span>
                            <StarRating rating={rating} interactive onRate={setRating} size={24} />
                          </div>
                          <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Provide detailed feedback on the student's technique, what they did well, and areas for improvement..."
                            rows={4}
                          />
                          <div className="vr-eval-actions">
                            <button
                              onClick={() => handleEvaluate(sub.id)}
                              className="btn-app btn-app-filled"
                              disabled={evalLoading}
                            >
                              <span className="btn-ball">🏓</span>
                              {evalLoading ? "Submitting..." : "Submit Evaluation"}
                            </button>
                            <button
                              onClick={() => { setEvalId(null); setFeedback(""); setRating(0); }}
                              className="btn-app btn-app-outline"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEvalId(sub.id)}
                          className="btn-app btn-app-filled"
                        >
                          <span className="btn-ball">🏓</span>
                          Evaluate
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {reviewedSubs.length > 0 && (
                <div className="vr-group">
                  <h2>✅ Reviewed ({reviewedSubs.length})</h2>
                  {reviewedSubs.map((sub) => (
                    <div key={sub.id} className="vr-card vr-card-reviewed">
                      <div className="vr-card-header">
                        <div>
                          <span className="vr-student-name">{sub.userName}</span>
                          <span className="vr-course-name">{sub.courseTitle}</span>
                        </div>
                        <span className="vr-date">{new Date(sub.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="vr-video">
                        <VideoPlayer url={sub.videoUrl} title={`${sub.userName}'s submission`} />
                      </div>
                      <div className="vr-feedback-box">
                        <strong>Your Feedback:</strong>
                        {sub.vendorRating && (
                          <div className="vr-fb-rating">
                            <StarRating rating={sub.vendorRating} size={14} />
                            <span>{sub.vendorRating}/5</span>
                          </div>
                        )}
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

      {/* Bookings tab */}
      {tab === "bookings" && (
        <div className="vr-content">
          {bookings.length === 0 ? (
            <div className="vr-empty">
              <span>📅</span>
              <p>No booking requests yet.</p>
            </div>
          ) : (
            bookings.map((booking) => (
              <div key={booking.id} className={`vr-card vr-booking-${booking.status}`}>
                <div className="vr-card-header">
                  <div>
                    <span className="vr-student-name">{booking.userName}</span>
                    <span className="vr-course-name">{booking.courseTitle}</span>
                  </div>
                  <span className={`vr-booking-status vr-bs-${booking.status}`}>
                    {booking.status === "pending" && "⏳ Pending"}
                    {booking.status === "confirmed" && "✅ Confirmed"}
                    {booking.status === "declined" && "❌ Declined"}
                  </span>
                </div>

                <div className="vr-booking-details">
                  <p><strong>📅 Requested:</strong> {new Date(booking.requestedDate).toLocaleString()}</p>
                  <p><strong>💬 Message:</strong> {booking.message}</p>
                </div>

                {booking.status === "pending" && (
                  respondId === booking.id ? (
                    <div className="vr-respond-form">
                      <textarea
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        placeholder="Optional message to the student..."
                        rows={2}
                      />
                      <div className="vr-respond-actions">
                        <button
                          onClick={() => handleBookingResponse(booking.id, "confirmed")}
                          className="btn-app btn-app-filled btn-sm"
                          disabled={respondLoading}
                        >
                          ✅ Confirm
                        </button>
                        <button
                          onClick={() => handleBookingResponse(booking.id, "declined")}
                          className="btn-app btn-danger btn-sm"
                          disabled={respondLoading}
                        >
                          ❌ Decline
                        </button>
                        <button
                          onClick={() => { setRespondId(null); setResponse(""); }}
                          className="btn-app btn-app-outline btn-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setRespondId(booking.id)}
                      className="btn-app btn-app-outline btn-sm"
                    >
                      Respond
                    </button>
                  )
                )}

                {booking.vendorResponse && (
                  <p className="vr-vendor-response"><strong>Your Response:</strong> {booking.vendorResponse}</p>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default VendorReviews;
