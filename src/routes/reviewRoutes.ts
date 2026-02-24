import { Router, Response } from "express";
import { db } from "../config/firebase";
import { verifyToken, AuthRequest } from "../middleware/authMiddleware";
import { Review } from "../models/types";
import { FieldValue } from "firebase-admin/firestore";

const router = Router();

// GET /api/reviews/:courseId — get reviews for a course (public)
router.get("/:courseId", async (req, res: Response) => {
  try {
    const courseId = req.params.courseId as string;
    const snapshot = await db
      .collection("reviews")
      .where("courseId", "==", courseId)
      .get();

    const reviews: Review[] = [];
    snapshot.forEach((doc) => {
      reviews.push({ id: doc.id, ...doc.data() } as Review);
    });
    reviews.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch reviews", error: String(err) });
  }
});

// POST /api/reviews/:courseId — add a review (authenticated users only)
router.post("/:courseId", verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const courseId = req.params.courseId as string;
    const { rating, text } = req.body;

    if (!rating || !text) {
      res.status(400).json({ message: "Rating and text are required" });
      return;
    }

    if (rating < 1 || rating > 5) {
      res.status(400).json({ message: "Rating must be between 1 and 5" });
      return;
    }

    // Verify course exists
    const courseRef = db.collection("courses").doc(courseId);
    const courseDoc = await courseRef.get();
    if (!courseDoc.exists) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    // Check if user already reviewed this course
    const existing = await db
      .collection("reviews")
      .where("courseId", "==", courseId)
      .where("userId", "==", req.user!.uid)
      .get();

    if (!existing.empty) {
      res.status(400).json({ message: "You have already reviewed this course" });
      return;
    }

    // Get user profile
    const userDoc = await db.collection("users").doc(req.user!.uid).get();
    const userData = userDoc.data();

    const reviewData: Omit<Review, "id"> = {
      courseId,
      userId: req.user!.uid,
      userName: userData?.displayName || req.user!.name || "Anonymous",
      userPhotoURL: userData?.photoURL || "",
      rating: Number(rating),
      text,
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection("reviews").add(reviewData);

    // Update course average rating
    const courseData = courseDoc.data()!;
    const newTotalReviews = (courseData.totalReviews || 0) + 1;
    const newAverage =
      ((courseData.averageRating || 0) * (courseData.totalReviews || 0) + Number(rating)) /
      newTotalReviews;

    await courseRef.update({
      averageRating: Math.round(newAverage * 10) / 10,
      totalReviews: FieldValue.increment(1),
    });

    res.status(201).json({ id: docRef.id, ...reviewData });
  } catch (err) {
    res.status(500).json({ message: "Failed to add review", error: String(err) });
  }
});

export default router;
