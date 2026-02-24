import { auth } from "../config/firebase";
import { Course, Review, UserProfile } from "../types";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

async function getHeaders(): Promise<HeadersInit> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = await getHeaders();
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || "Request failed");
  }
  return res.json();
}

// Courses
export const getCourses = () => request<Course[]>("/api/courses");

export const getCourse = (id: string) => request<Course>(`/api/courses/${id}`);

export const createCourse = (data: Partial<Course>) =>
  request<Course>("/api/courses", { method: "POST", body: JSON.stringify(data) });

export const updateCourse = (id: string, data: Partial<Course>) =>
  request<Course>(`/api/courses/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteCourse = (id: string) =>
  request<{ message: string }>(`/api/courses/${id}`, { method: "DELETE" });

// Reviews
export const getReviews = (courseId: string) =>
  request<Review[]>(`/api/reviews/${courseId}`);

export const addReview = (courseId: string, data: { rating: number; text: string }) =>
  request<Review>(`/api/reviews/${courseId}`, { method: "POST", body: JSON.stringify(data) });

// Users
export const getUserProfile = () =>
  request<UserProfile>("/api/users/profile");

export const updateUserProfile = (data: Partial<UserProfile>) =>
  request<UserProfile>("/api/users/profile", { method: "PUT", body: JSON.stringify(data) });

export const getPublicProfile = (uid: string) =>
  request<Partial<UserProfile>>(`/api/users/${uid}`);

// Payments
export const createCheckoutSession = (
  items: { courseId: string; title: string; price: number; thumbnailUrl?: string }[]
) =>
  request<{ sessionId: string; url: string }>("/api/payments/create-checkout-session", {
    method: "POST",
    body: JSON.stringify({ items }),
  });

export const confirmPayment = (sessionId: string) =>
  request<{ enrollments: any[] }>("/api/payments/confirm", {
    method: "POST",
    body: JSON.stringify({ sessionId }),
  });

export const getEnrollments = () =>
  request<any[]>("/api/payments/enrollments");

// Submissions
export const submitVideo = (courseId: string, data: { videoUrl: string; notes: string }) =>
  request<any>(`/api/submissions/${courseId}`, { method: "POST", body: JSON.stringify(data) });

export const getMySubmissions = (courseId: string) =>
  request<any[]>(`/api/submissions/my/${courseId}`);

export const getVendorSubmissions = () =>
  request<any[]>("/api/submissions/vendor/all");

export const evaluateSubmission = (id: string, data: { vendorFeedback: string; vendorRating?: number }) =>
  request<any>(`/api/submissions/${id}/evaluate`, { method: "PUT", body: JSON.stringify(data) });

// Bookings
export const createBooking = (courseId: string, data: { requestedDate: string; requestedEndTime: string; message: string }) =>
  request<any>(`/api/bookings/${courseId}`, { method: "POST", body: JSON.stringify(data) });

export const getMyBookings = () =>
  request<any[]>("/api/bookings/my/all");

export const getVendorBookings = () =>
  request<any[]>("/api/bookings/vendor/all");

export const respondToBooking = (id: string, data: { status: string; vendorResponse?: string }) =>
  request<any>(`/api/bookings/${id}/respond`, { method: "PUT", body: JSON.stringify(data) });

// Messages
export const searchUsers = (q: string) =>
  request<any[]>(`/api/messages/users/search?q=${encodeURIComponent(q)}`);

export const getConversations = () =>
  request<any[]>("/api/messages/conversations");

export const createConversation = (data: { type: "dm" | "group"; name?: string; participantUids: string[] }) =>
  request<any>("/api/messages/conversations", { method: "POST", body: JSON.stringify(data) });

export const getMessages = (conversationId: string) =>
  request<any[]>(`/api/messages/conversations/${conversationId}/messages`);

export const sendMessage = (conversationId: string, text: string) =>
  request<any>(`/api/messages/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
