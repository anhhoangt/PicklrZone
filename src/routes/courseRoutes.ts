import { Router, Response } from "express";
import { db } from "../config/firebase";
import { verifyToken, requireVendor, AuthRequest } from "../middleware/authMiddleware";
import { Course, Lesson } from "../models/types";

const router = Router();

// GET /api/courses — list all courses (public)
router.get("/", async (_req, res: Response) => {
  try {
    const snapshot = await db.collection("courses").orderBy("createdAt", "desc").get();
    const courses: Course[] = [];
    snapshot.forEach((doc) => {
      courses.push({ id: doc.id, ...doc.data() } as Course);
    });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch courses", error: String(err) });
  }
});

// GET /api/courses/:id — get single course (public)
router.get("/:id", async (req, res: Response) => {
  try {
    const courseId = req.params.id as string;
    const doc = await db.collection("courses").doc(courseId).get();
    if (!doc.exists) {
      res.status(404).json({ message: "Course not found" });
      return;
    }
    res.json({ id: doc.id, ...doc.data() } as Course);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch course", error: String(err) });
  }
});

// POST /api/courses — create course (vendor only)
router.post("/", verifyToken, requireVendor, async (req: AuthRequest, res: Response) => {
  try {
    const {
      title, description, shortDescription, price,
      thumbnailUrl, introVideoUrl, category, level, lessons,
    } = req.body;

    if (!title || !description || !shortDescription || price == null || !category || !level) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    // Get vendor profile for name/photo/location
    const vendorDoc = await db.collection("users").doc(req.user!.uid).get();
    const vendorData = vendorDoc.data();

    const now = new Date().toISOString();
    const courseData: Omit<Course, "id"> = {
      title,
      description,
      shortDescription,
      price: Number(price),
      thumbnailUrl: thumbnailUrl || "",
      introVideoUrl: introVideoUrl || "",
      category,
      level,
      lessons: (lessons as Lesson[]) || [],
      vendorId: req.user!.uid,
      vendorName: vendorData?.displayName || req.user!.name || "Unknown",
      vendorPhotoURL: vendorData?.photoURL || "",
      vendorLocation: vendorData?.location || "",
      averageRating: 0,
      totalReviews: 0,
      totalStudents: 0,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db.collection("courses").add(courseData);
    res.status(201).json({ id: docRef.id, ...courseData });
  } catch (err) {
    res.status(500).json({ message: "Failed to create course", error: String(err) });
  }
});

// PUT /api/courses/:id — update course (owner vendor only)
router.put("/:id", verifyToken, requireVendor, async (req: AuthRequest, res: Response) => {
  try {
    const courseId = req.params.id as string;
    const docRef = db.collection("courses").doc(courseId);
    const doc = await docRef.get();

    if (!doc.exists) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    const course = doc.data() as Course;
    if (course.vendorId !== req.user!.uid) {
      res.status(403).json({ message: "You can only edit your own courses" });
      return;
    }

    const updates = {
      ...req.body,
      vendorId: course.vendorId, // prevent changing vendor
      updatedAt: new Date().toISOString(),
    };

    await docRef.update(updates);
    const updated = await docRef.get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (err) {
    res.status(500).json({ message: "Failed to update course", error: String(err) });
  }
});

// DELETE /api/courses/:id — delete course (owner vendor only)
router.delete("/:id", verifyToken, requireVendor, async (req: AuthRequest, res: Response) => {
  try {
    const courseId = req.params.id as string;
    const docRef = db.collection("courses").doc(courseId);
    const doc = await docRef.get();

    if (!doc.exists) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    const course = doc.data() as Course;
    if (course.vendorId !== req.user!.uid) {
      res.status(403).json({ message: "You can only delete your own courses" });
      return;
    }

    // Delete associated reviews
    const reviewsSnapshot = await db.collection("reviews").where("courseId", "==", courseId).get();
    const batch = db.batch();
    reviewsSnapshot.forEach((reviewDoc) => batch.delete(reviewDoc.ref));
    batch.delete(docRef);
    await batch.commit();

    res.json({ message: "Course deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete course", error: String(err) });
  }
});

export default router;
