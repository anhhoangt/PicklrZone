import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getCourse, getEnrollments, getMySubmissions, submitVideo, createBooking,
} from "../services/api";
import { Course, Lesson, Submission } from "../types";
import VideoPlayer from "../components/VideoPlayer";
import StarRating from "../components/StarRating";
import { useAuth } from "../contexts/AuthContext";
import "./CourseLearning.css";

type Tab = "lessons" | "booking" | "submissions";

const CourseLearning: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { currentUser } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [activeLessonIdx, setActiveLessonIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>("lessons");

  // Submissions
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Booking
  const [bookDate, setBookDate] = useState("");
  const [bookMessage, setBookMessage] = useState("");
  const [bookLoading, setBookLoading] = useState(false);
  const [bookSuccess, setBookSuccess] = useState(false);
  const [bookError, setBookError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [courseData, enrollments] = await Promise.all([
          getCourse(courseId!),
          getEnrollments(),
        ]);
        setCourse(courseData);
        const isEnrolled = enrollments.some((e: any) => e.courseId === courseId);
        setEnrolled(isEnrolled);

        if (!isEnrolled) { setLoading(false); return; }

        if (courseData.lessons?.length > 0) {
          const sorted = [...courseData.lessons].sort((a, b) => a.order - b.order);
          setActiveLesson(sorted[0]);
        }

        try {
          const subs = await getMySubmissions(courseId!);
          setSubmissions(subs);
        } catch {}
      } catch (err) {
        console.error("Failed to load course", err);
      }
      setLoading(false);
    };
    load();
  }, [courseId, currentUser]);

  const selectLesson = (lesson: Lesson, idx: number) => {
    setActiveLesson(lesson);
    setActiveLessonIdx(idx);
    setActiveTab("lessons");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goNextLesson = () => {
    const sorted = [...(course?.lessons || [])].sort((a, b) => a.order - b.order);
    if (activeLessonIdx < sorted.length - 1) {
      selectLesson(sorted[activeLessonIdx + 1], activeLessonIdx + 1);
    }
  };

  const goPrevLesson = () => {
    const sorted = [...(course?.lessons || [])].sort((a, b) => a.order - b.order);
    if (activeLessonIdx > 0) {
      selectLesson(sorted[activeLessonIdx - 1], activeLessonIdx - 1);
    }
  };

  const handleSubmitVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim()) { setSubmitError("Please provide a video URL"); return; }
    setSubmitLoading(true);
    setSubmitError("");
    try {
      const newSub = await submitVideo(courseId!, { videoUrl, notes });
      setSubmissions([newSub, ...submissions]);
      setVideoUrl("");
      setNotes("");
      setSubmitSuccess(true);
    } catch (err: any) {
      setSubmitError(err.message || "Failed to submit video");
    }
    setSubmitLoading(false);
  };

  const handleBookSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookDate || !bookMessage.trim()) { setBookError("Date and message required"); return; }
    setBookLoading(true);
    setBookError("");
    try {
      await createBooking(courseId!, { requestedDate: bookDate, message: bookMessage });
      setBookDate("");
      setBookMessage("");
      setBookSuccess(true);
    } catch (err: any) {
      setBookError(err.message || "Failed to book session");
    }
    setBookLoading(false);
  };

  if (loading) {
    return (
      <div className="cl-state">
        <span className="bounce-ball">🏓</span>
        <p>Loading course...</p>
      </div>
    );
  }

  if (!enrolled) {
    return (
      <div className="cl-state">
        <div className="cl-lock-icon">🔒</div>
        <h2>Course Locked</h2>
        <p>Purchase this course to unlock all lessons, video content, training sessions, and instructor feedback.</p>
        <Link to={`/courses/${courseId}`} className="btn-app btn-app-filled">
          <span className="btn-ball">🏓</span>
          View Course Details
        </Link>
      </div>
    );
  }

  if (!course) {
    return <div className="cl-state"><h2>Course not found</h2></div>;
  }

  const sortedLessons = [...(course.lessons || [])].sort((a, b) => a.order - b.order);
  const totalDuration = sortedLessons.reduce((s, l) => s + (l.duration || 0), 0);

  return (
    <div className="course-learning">
      {/* Course banner */}
      <div className="cl-banner">
        <div className="cl-banner-info">
          <Link to="/my-learning" className="cl-back-link">← My Learning</Link>
          <h1>{course.title}</h1>
          <div className="cl-banner-meta">
            <span>by <strong>{course.vendorName}</strong></span>
            <span>•</span>
            <span>{sortedLessons.length} lessons</span>
            <span>•</span>
            <span>{totalDuration} min</span>
            <span>•</span>
            <span className="cl-banner-level">{course.level}</span>
          </div>
        </div>
      </div>

      {/* Main player area */}
      <div className="cl-main">
        {/* Video player */}
        <div className="cl-player">
          {activeLesson?.videoUrl ? (
            <VideoPlayer url={activeLesson.videoUrl} title={activeLesson.title} />
          ) : (
            <div className="cl-no-video">
              <span>📹</span>
              <p>No video for this lesson</p>
              <p className="cl-no-video-hint">Check the lesson notes below</p>
            </div>
          )}

          {/* Lesson nav */}
          <div className="cl-lesson-nav">
            <button
              className="cl-nav-btn"
              onClick={goPrevLesson}
              disabled={activeLessonIdx === 0}
            >
              ← Previous
            </button>
            <span className="cl-lesson-counter">
              Lesson {activeLessonIdx + 1} of {sortedLessons.length}
            </span>
            <button
              className="cl-nav-btn"
              onClick={goNextLesson}
              disabled={activeLessonIdx === sortedLessons.length - 1}
            >
              Next →
            </button>
          </div>

          {/* Active lesson info */}
          <div className="cl-active-lesson">
            <div className="cl-active-num">{activeLessonIdx + 1}</div>
            <div>
              <h2>{activeLesson?.title}</h2>
              {activeLesson?.description && <p>{activeLesson.description}</p>}
              {activeLesson?.duration && (
                <span className="cl-active-duration">⏱️ {activeLesson.duration} min</span>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar — lesson list */}
        <div className="cl-sidebar">
          <div className="cl-sidebar-header">
            <h3>Course Content</h3>
            <span>{sortedLessons.length} lessons • {totalDuration} min</span>
          </div>
          <div className="cl-lesson-list">
            {sortedLessons.map((lesson, idx) => (
              <button
                key={idx}
                className={`cl-lesson-btn ${idx === activeLessonIdx ? "cl-lesson-current" : ""}`}
                onClick={() => selectLesson(lesson, idx)}
              >
                <span className="cl-lesson-idx">{idx + 1}</span>
                <div className="cl-lesson-text">
                  <span className="cl-lesson-name">{lesson.title}</span>
                  <span className="cl-lesson-meta">
                    {lesson.videoUrl ? "▶️ " : "📝 "}
                    {lesson.duration ? `${lesson.duration} min` : "Notes only"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs: Lessons / Book Session / Submit Video */}
      <div className="cl-tabs">
        <button
          className={`cl-tab ${activeTab === "lessons" ? "cl-tab-active" : ""}`}
          onClick={() => setActiveTab("lessons")}
        >
          📖 About This Course
        </button>
        <button
          className={`cl-tab ${activeTab === "booking" ? "cl-tab-active" : ""}`}
          onClick={() => setActiveTab("booking")}
        >
          📅 Book a Session
        </button>
        <button
          className={`cl-tab ${activeTab === "submissions" ? "cl-tab-active" : ""}`}
          onClick={() => setActiveTab("submissions")}
        >
          🎥 Submit Practice Video
          {submissions.some((s) => s.status === "reviewed") && (
            <span className="cl-tab-dot" />
          )}
        </button>
      </div>

      {/* Tab content */}
      <div className="cl-tab-content">
        {/* About tab */}
        {activeTab === "lessons" && (
          <div className="cl-about">
            <div className="cl-about-section">
              <h3>What You'll Learn</h3>
              <div className="cl-about-desc">{course.description}</div>
            </div>
            <div className="cl-about-section">
              <h3>Instructor</h3>
              <div className="cl-about-instructor">
                {course.vendorPhotoURL ? (
                  <img src={course.vendorPhotoURL} alt="" className="cl-instructor-avatar" />
                ) : (
                  <div className="cl-instructor-placeholder">
                    {course.vendorName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <strong>{course.vendorName}</strong>
                  {course.vendorLocation && <span>📍 {course.vendorLocation}</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Booking tab */}
        {activeTab === "booking" && (
          <div className="cl-booking">
            <div className="cl-section-header">
              <span className="cl-section-icon">📅</span>
              <div>
                <h3>Book a Training Session</h3>
                <p>Request an in-person or virtual session with <strong>{course.vendorName}</strong></p>
              </div>
            </div>

            {bookSuccess ? (
              <div className="cl-success-box">
                <span>✅</span>
                <div>
                  <strong>Session Requested!</strong>
                  <p>{course.vendorName} will review your request and respond soon.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBookSession} className="cl-form">
                {bookError && <div className="cl-error">{bookError}</div>}
                <label className="form-label">
                  Preferred Date & Time
                  <input
                    type="datetime-local"
                    value={bookDate}
                    onChange={(e) => setBookDate(e.target.value)}
                    required
                  />
                </label>
                <label className="form-label">
                  What would you like to work on?
                  <textarea
                    value={bookMessage}
                    onChange={(e) => setBookMessage(e.target.value)}
                    placeholder="Describe the skills you want to improve, your availability, and whether you prefer in-person or virtual..."
                    rows={4}
                    required
                  />
                </label>
                <button type="submit" className="btn-app btn-app-filled" disabled={bookLoading}>
                  <span className="btn-ball">🏓</span>
                  {bookLoading ? "Sending..." : "Request Session"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Submissions tab */}
        {activeTab === "submissions" && (
          <div className="cl-submit">
            <div className="cl-section-header">
              <span className="cl-section-icon">🎥</span>
              <div>
                <h3>Submit Your Practice Video</h3>
                <p>Record yourself practicing, share the video, and get personalized feedback from <strong>{course.vendorName}</strong></p>
              </div>
            </div>

            {submitSuccess && (
              <div className="cl-success-box">
                <span>✅</span>
                <div>
                  <strong>Video Submitted!</strong>
                  <p>Your instructor will review and evaluate your performance.</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitVideo} className="cl-form">
              {submitError && <div className="cl-error">{submitError}</div>}
              <label className="form-label">
                Video URL (YouTube, Google Drive, Vimeo)
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                />
              </label>
              <label className="form-label">
                Notes for Your Instructor
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What skills are you demonstrating? Any specific areas you want feedback on?"
                  rows={3}
                />
              </label>
              <button type="submit" className="btn-app btn-app-filled" disabled={submitLoading}>
                <span className="btn-ball">🏓</span>
                {submitLoading ? "Submitting..." : "Submit Video for Review"}
              </button>
            </form>

            {/* Previous submissions */}
            {submissions.length > 0 && (
              <div className="cl-past-subs">
                <h3>Your Submissions ({submissions.length})</h3>
                {submissions.map((sub) => (
                  <div key={sub.id} className={`cl-sub-card cl-sub-${sub.status}`}>
                    <div className="cl-sub-top">
                      <span className={`cl-sub-badge cl-sub-badge-${sub.status}`}>
                        {sub.status === "pending" ? "⏳ Pending Review" : "✅ Reviewed"}
                      </span>
                      <span className="cl-sub-date">
                        {new Date(sub.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="cl-sub-video">
                      <VideoPlayer url={sub.videoUrl} title="Your submission" />
                    </div>

                    {sub.notes && <p className="cl-sub-notes">📝 {sub.notes}</p>}

                    {sub.status === "reviewed" && (
                      <div className="cl-feedback">
                        <div className="cl-feedback-header">
                          <strong>🏆 Instructor Feedback</strong>
                          {sub.vendorRating && (
                            <div className="cl-feedback-rating">
                              <StarRating rating={sub.vendorRating} size={16} />
                              <span>{sub.vendorRating}/5</span>
                            </div>
                          )}
                        </div>
                        <p>{sub.vendorFeedback}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseLearning;
