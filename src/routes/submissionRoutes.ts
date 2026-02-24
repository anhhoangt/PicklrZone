import { Router, Response } from "express";
import { db } from "../config/firebase";
import { verifyToken, requireVendor, AuthRequest } from "../middleware/authMiddleware";
import { Submission } from "../models/types";

const router = Router();

// POST /api/submissions/:courseId — student submits a practice video
router.post("/:courseId", verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const courseId = req.params.courseId as string;
    const { videoUrl, notes } = req.body;

    if (!videoUrl) {
      res.status(400).json({ message: "Video URL is required" });
      return;
    }

    // Verify enrollment
    const enrollment = await db
      .collection("enrollments")
      .where("userId", "==", req.user!.uid)
      .where("courseId", "==", courseId)
      .get();

    if (enrollment.empty) {
      res.status(403).json({ message: "You must be enrolled to submit" });
      return;
    }

    // Get course data for vendor info
    const courseDoc = await db.collection("courses").doc(courseId).get();
    if (!courseDoc.exists) {
      res.status(404).json({ message: "Course not found" });
      return;
    }
    const courseData = courseDoc.data()!;

    // Get user profile
    const userDoc = await db.collection("users").doc(req.user!.uid).get();
    const userData = userDoc.data();

    const submissionData: Omit<Submission, "id"> = {
      courseId,
      courseTitle: courseData.title,
      userId: req.user!.uid,
      userName: userData?.displayName || req.user!.name || "Anonymous",
      userPhotoURL: userData?.photoURL || "",
      videoUrl,
      notes: notes || "",
      status: "pending",
      vendorId: courseData.vendorId,
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection("submissions").add(submissionData);
    res.status(201).json({ id: docRef.id, ...submissionData });
  } catch (err) {
    res.status(500).json({ message: "Failed to submit", error: String(err) });
  }
});

// GET /api/submissions/my/:courseId — get student's own submissions for a course
router.get("/my/:courseId", verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const courseId = req.params.courseId as string;
    const snapshot = await db
      .collection("submissions")
      .where("userId", "==", req.user!.uid)
      .where("courseId", "==", courseId)
      .get();

    const submissions: Submission[] = [];
    snapshot.forEach((doc) => {
      submissions.push({ id: doc.id, ...doc.data() } as Submission);
    });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch submissions", error: String(err) });
  }
});

// GET /api/submissions/vendor — get all submissions for vendor's courses
router.get("/vendor/all", verifyToken, requireVendor, async (req: AuthRequest, res: Response) => {
  try {
    const snapshot = await db
      .collection("submissions")
      .where("vendorId", "==", req.user!.uid)
      .get();

    const submissions: Submission[] = [];
    snapshot.forEach((doc) => {
      submissions.push({ id: doc.id, ...doc.data() } as Submission);
    });
    submissions.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch submissions", error: String(err) });
  }
});

// PUT /api/submissions/:id/evaluate — vendor evaluates a submission
router.put("/:id/evaluate", verifyToken, requireVendor, async (req: AuthRequest, res: Response) => {
  try {
    const submissionId = req.params.id as string;
    const { vendorFeedback, vendorRating } = req.body;

    if (!vendorFeedback) {
      res.status(400).json({ message: "Feedback is required" });
      return;
    }

    const docRef = db.collection("submissions").doc(submissionId);
    const doc = await docRef.get();

    if (!doc.exists) {
      res.status(404).json({ message: "Submission not found" });
      return;
    }

    const submission = doc.data()!;
    if (submission.vendorId !== req.user!.uid) {
      res.status(403).json({ message: "You can only evaluate submissions for your courses" });
      return;
    }

    await docRef.update({
      vendorFeedback,
      vendorRating: vendorRating || null,
      status: "reviewed",
      reviewedAt: new Date().toISOString(),
    });

    const updated = await docRef.get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (err) {
    res.status(500).json({ message: "Failed to evaluate", error: String(err) });
  }
});

export default router;
