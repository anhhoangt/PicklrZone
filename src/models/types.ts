export type UserRole = "user" | "vendor";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  bio?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  title: string;
  description?: string;
  videoUrl?: string;
  duration?: number; // minutes
  order: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  price: number;
  thumbnailUrl: string;
  introVideoUrl: string;
  category: string;
  level: "beginner" | "intermediate" | "advanced" | "all-levels";
  lessons: Lesson[];
  vendorId: string;
  vendorName: string;
  vendorPhotoURL?: string;
  vendorLocation?: string;
  averageRating: number;
  totalReviews: number;
  totalStudents: number;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  courseId: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  rating: number; // 1-5
  text: string;
  createdAt: string;
}

export type BookingStatus = "pending" | "confirmed" | "declined";
export type SubmissionStatus = "pending" | "reviewed";

export interface Booking {
  id: string;
  courseId: string;
  courseTitle: string;
  userId: string;
  userName: string;
  vendorId: string;
  vendorName: string;
  requestedDate: string;
  requestedEndTime: string;
  message: string;
  status: BookingStatus;
  vendorResponse?: string;
  createdAt: string;
}

export interface Submission {
  id: string;
  courseId: string;
  courseTitle: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  videoUrl: string;
  notes: string;
  status: SubmissionStatus;
  vendorId: string;
  vendorFeedback?: string;
  vendorRating?: number; // 1-5
  createdAt: string;
  reviewedAt?: string;
}

export type ConversationType = "dm" | "group";

export interface Conversation {
  id: string;
  type: ConversationType;
  name?: string; // group name
  participants: string[]; // uids
  participantNames: Record<string, string>;
  participantPhotos: Record<string, string>;
  lastMessage?: string;
  lastMessageBy?: string;
  lastMessageAt?: string;
  lastReadAt: Record<string, string>;
  createdBy: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderPhotoURL?: string;
  text: string;
  createdAt: string;
}
