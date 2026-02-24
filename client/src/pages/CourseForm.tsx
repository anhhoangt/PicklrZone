import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createCourse, getCourse, updateCourse } from "../services/api";
import { COURSE_CATEGORIES, COURSE_LEVELS, Lesson } from "../types";
import "./CourseForm.css";

const CourseForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [introVideoUrl, setIntroVideoUrl] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState<string>("");
  const [lessons, setLessons] = useState<Lesson[]>([]);

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isEdit && id) {
      getCourse(id)
        .then((course) => {
          setTitle(course.title);
          setShortDescription(course.shortDescription);
          setDescription(course.description);
          setPrice(String(course.price));
          setThumbnailUrl(course.thumbnailUrl);
          setIntroVideoUrl(course.introVideoUrl);
          setCategory(course.category);
          setLevel(course.level);
          setLessons(course.lessons || []);
        })
        .catch(() => setError("Failed to load course"))
        .finally(() => setLoading(false));
    }
  }, [isEdit, id]);

  const addLesson = () => {
    setLessons([
      ...lessons,
      { title: "", description: "", videoUrl: "", duration: 0, order: lessons.length + 1 },
    ]);
  };

  const updateLesson = (index: number, field: keyof Lesson, value: string | number) => {
    const updated = [...lessons];
    updated[index] = { ...updated[index], [field]: value };
    setLessons(updated);
  };

  const removeLesson = (index: number) => {
    setLessons(lessons.filter((_, i) => i !== index).map((l, i) => ({ ...l, order: i + 1 })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title || !shortDescription || !description || !category || !level) {
      setError("Please fill all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        title,
        shortDescription,
        description,
        price: Number(price) || 0,
        thumbnailUrl,
        introVideoUrl,
        category,
        level: level as "beginner" | "intermediate" | "advanced" | "all-levels",
        lessons,
      };

      if (isEdit && id) {
        await updateCourse(id, data);
      } else {
        await createCourse(data);
      }
      navigate("/vendor/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to save course");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="form-loading">
        <span className="bounce-ball">🏓</span>
        <p>Loading course...</p>
      </div>
    );
  }

  return (
    <div className="course-form-page">
      <h1>{isEdit ? "Edit Course" : "Create New Course"}</h1>

      {error && <div className="form-error">{error}</div>}

      <form onSubmit={handleSubmit} className="course-form">
        {/* Basic info */}
        <section className="form-section">
          <h2>Basic Information</h2>
          <label className="form-label">
            Title *
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Mastering the Third Shot Drop"
              required
            />
          </label>
          <label className="form-label">
            Short Description *
            <input
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="A brief summary (shown on course cards)"
              maxLength={150}
              required
            />
          </label>
          <label className="form-label">
            Full Description *
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of your course..."
              rows={6}
              required
            />
          </label>
          <div className="form-row">
            <label className="form-label">
              Category *
              <select value={category} onChange={(e) => setCategory(e.target.value)} required>
                <option value="">Select category</option>
                {COURSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </label>
            <label className="form-label">
              Level *
              <select value={level} onChange={(e) => setLevel(e.target.value)} required>
                <option value="">Select level</option>
                {COURSE_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>
            </label>
            <label className="form-label">
              Price ($)
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0 for free"
                min="0"
                step="0.01"
              />
            </label>
          </div>
        </section>

        {/* Media */}
        <section className="form-section">
          <h2>Media</h2>
          <label className="form-label">
            Thumbnail URL
            <input
              type="url"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://example.com/thumbnail.jpg"
            />
          </label>
          <label className="form-label">
            Introduction Video URL (YouTube or Vimeo)
            <input
              type="url"
              value={introVideoUrl}
              onChange={(e) => setIntroVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </label>
        </section>

        {/* Lessons */}
        <section className="form-section">
          <div className="form-section-header">
            <h2>Lessons</h2>
            <button type="button" onClick={addLesson} className="btn-app btn-app-outline btn-sm">
              + Add Lesson
            </button>
          </div>

          {lessons.length === 0 && (
            <p className="form-hint">Add lessons to structure your course content.</p>
          )}

          {lessons.map((lesson, idx) => (
            <div key={idx} className="lesson-form-item">
              <div className="lesson-form-header">
                <span className="lesson-form-num">{idx + 1}</span>
                <button
                  type="button"
                  onClick={() => removeLesson(idx)}
                  className="lesson-remove"
                >
                  ✕
                </button>
              </div>
              <div className="form-row">
                <label className="form-label">
                  Lesson Title
                  <input
                    type="text"
                    value={lesson.title}
                    onChange={(e) => updateLesson(idx, "title", e.target.value)}
                    placeholder="Lesson title"
                  />
                </label>
                <label className="form-label" style={{ maxWidth: 120 }}>
                  Duration (min)
                  <input
                    type="number"
                    value={lesson.duration || ""}
                    onChange={(e) => updateLesson(idx, "duration", Number(e.target.value))}
                    placeholder="0"
                    min="0"
                  />
                </label>
              </div>
              <label className="form-label">
                Description
                <input
                  type="text"
                  value={lesson.description || ""}
                  onChange={(e) => updateLesson(idx, "description", e.target.value)}
                  placeholder="What students will learn"
                />
              </label>
              <label className="form-label">
                Video URL
                <input
                  type="url"
                  value={lesson.videoUrl || ""}
                  onChange={(e) => updateLesson(idx, "videoUrl", e.target.value)}
                  placeholder="https://..."
                />
              </label>
            </div>
          ))}
        </section>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate("/vendor/dashboard")}
            className="btn-app btn-app-outline"
          >
            Cancel
          </button>
          <button type="submit" className="btn-app btn-app-filled" disabled={submitting}>
            <span className="btn-ball">🏓</span>
            {submitting ? "Saving..." : isEdit ? "Update Course" : "Publish Course"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CourseForm;
