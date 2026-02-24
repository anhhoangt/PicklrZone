import React, { useEffect, useState } from "react";
import { getCourses } from "../services/api";
import { Course, COURSE_CATEGORIES, COURSE_LEVELS } from "../types";
import CourseCard from "../components/CourseCard";
import "./Marketplace.css";

const Marketplace: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getCourses();
        setCourses(data);
      } catch (err) {
        console.error("Failed to load courses", err);
      }
      setLoading(false);
    };
    load();
  }, []);

  const filtered = courses.filter((c) => {
    const matchSearch =
      !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.shortDescription.toLowerCase().includes(search.toLowerCase()) ||
      c.vendorName.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !category || c.category === category;
    const matchLevel = !level || c.level === level;
    return matchSearch && matchCategory && matchLevel;
  });

  return (
    <div className="marketplace">
      <div className="marketplace-header">
        <h1>Pickleball Courses</h1>
        <p>Learn from experts. Elevate your game.</p>
      </div>

      <div className="marketplace-filters">
        <input
          type="text"
          placeholder="Search courses, instructors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="filter-search"
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="filter-select">
          <option value="">All Categories</option>
          {COURSE_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select value={level} onChange={(e) => setLevel(e.target.value)} className="filter-select">
          <option value="">All Levels</option>
          {COURSE_LEVELS.map((lvl) => (
            <option key={lvl} value={lvl}>{lvl}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="marketplace-loading">
          <span className="bounce-ball">🏓</span>
          <p>Loading courses...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="marketplace-empty">
          <span>🏓</span>
          <h3>No courses found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="course-grid">
          {filtered.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Marketplace;
