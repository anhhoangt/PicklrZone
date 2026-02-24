import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getMyBookings, getVendorBookings } from "../services/api";
import { Booking } from "../types";
import "./UpcomingEvents.css";

const UpcomingEvents: React.FC = () => {
  const { currentUser, userRole } = useAuth();
  const [events, setEvents] = useState<Booking[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        let bookings: Booking[] = [];

        // Fetch both student and vendor bookings
        const [studentBookings, vendorBookings] = await Promise.all([
          getMyBookings().catch(() => []),
          userRole === "vendor" ? getVendorBookings().catch(() => []) : Promise.resolve([]),
        ]);

        // Merge and deduplicate by id
        const all = [...studentBookings, ...vendorBookings];
        const seen = new Set<string>();
        bookings = all.filter((b) => {
          if (seen.has(b.id)) return false;
          seen.add(b.id);
          return true;
        });

        // Filter to confirmed + upcoming within next 7 days
        const now = new Date();
        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const upcoming = bookings
          .filter(
            (b) =>
              b.status === "confirmed" &&
              new Date(b.requestedDate) >= now &&
              new Date(b.requestedDate) <= weekFromNow
          )
          .sort(
            (a, b) =>
              new Date(a.requestedDate).getTime() - new Date(b.requestedDate).getTime()
          );

        setEvents(upcoming);
      } catch {}
      setLoading(false);
    };

    load();
  }, [currentUser, userRole]);

  // Check if was dismissed this session
  useEffect(() => {
    const key = `picklrzone_events_dismissed_${new Date().toDateString()}`;
    if (sessionStorage.getItem(key)) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    const key = `picklrzone_events_dismissed_${new Date().toDateString()}`;
    sessionStorage.setItem(key, "true");
    setDismissed(true);
  };

  if (loading || dismissed || !currentUser || events.length === 0) {
    return null;
  }

  const formatTimeRange = (b: Booking) => {
    const start = new Date(b.requestedDate).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const end = b.requestedEndTime
      ? new Date(b.requestedEndTime).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";
    return end ? `${start} — ${end}` : start;
  };

  const getRelativeDay = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  };

  return (
    <div className="upcoming-events">
      <div className="ue-header">
        <div className="ue-header-left">
          <span className="ue-bell">🔔</span>
          <strong>Upcoming Sessions</strong>
          <span className="ue-count">{events.length}</span>
        </div>
        <button className="ue-dismiss" onClick={handleDismiss}>✕</button>
      </div>

      <div className="ue-list">
        {events.map((event) => {
          const isVendorSession = event.vendorId === currentUser?.uid;
          const isToday = new Date(event.requestedDate).toDateString() === new Date().toDateString();

          return (
            <div
              key={event.id}
              className={`ue-item ${isToday ? "ue-item-today" : ""}`}
            >
              <div className="ue-item-when">
                <span className={`ue-day ${isToday ? "ue-day-today" : ""}`}>
                  {getRelativeDay(event.requestedDate)}
                </span>
                <span className="ue-time">{formatTimeRange(event)}</span>
              </div>

              <div className="ue-item-what">
                <span className={`ue-role-pill ${isVendorSession ? "ue-role-teaching" : "ue-role-learning"}`}>
                  {isVendorSession ? "🏫 Teaching" : "🎓 Learning"}
                </span>
                <span className="ue-item-course">{event.courseTitle}</span>
                <span className="ue-item-with">
                  {isVendorSession ? `Student: ${event.userName}` : `Instructor: ${event.vendorName}`}
                </span>
              </div>

              <Link
                to={isVendorSession ? "/vendor/dashboard" : "/my-learning"}
                className="ue-item-link"
                onClick={() => {
                  if (isVendorSession) {
                    // Will open schedule tab
                  }
                }}
              >
                View →
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UpcomingEvents;
