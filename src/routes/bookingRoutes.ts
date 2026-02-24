import { Router, Response } from "express";
import { db } from "../config/firebase";
import { verifyToken, requireVendor, AuthRequest } from "../middleware/authMiddleware";
import { Booking } from "../models/types";

const router = Router();

// POST /api/bookings/:courseId — student requests a training session
router.post("/:courseId", verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const courseId = req.params.courseId as string;
    const { requestedDate, message } = req.body;

    if (!requestedDate || !message) {
      res.status(400).json({ message: "Date and message are required" });
      return;
    }

    // Verify enrollment
    const enrollment = await db
      .collection("enrollments")
      .where("userId", "==", req.user!.uid)
      .where("courseId", "==", courseId)
      .get();

    if (enrollment.empty) {
      res.status(403).json({ message: "You must be enrolled to book a session" });
      return;
    }

    // Get course + vendor info
    const courseDoc = await db.collection("courses").doc(courseId).get();
    if (!courseDoc.exists) {
      res.status(404).json({ message: "Course not found" });
      return;
    }
    const courseData = courseDoc.data()!;

    const userDoc = await db.collection("users").doc(req.user!.uid).get();
    const userData = userDoc.data();

    const bookingData: Omit<Booking, "id"> = {
      courseId,
      courseTitle: courseData.title,
      userId: req.user!.uid,
      userName: userData?.displayName || req.user!.name || "Anonymous",
      vendorId: courseData.vendorId,
      vendorName: courseData.vendorName,
      requestedDate,
      message,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection("bookings").add(bookingData);
    res.status(201).json({ id: docRef.id, ...bookingData });
  } catch (err) {
    res.status(500).json({ message: "Failed to create booking", error: String(err) });
  }
});

// GET /api/bookings/my — get student's bookings
router.get("/my/all", verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const snapshot = await db
      .collection("bookings")
      .where("userId", "==", req.user!.uid)
      .get();

    const bookings: Booking[] = [];
    snapshot.forEach((doc) => {
      bookings.push({ id: doc.id, ...doc.data() } as Booking);
    });
    bookings.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch bookings", error: String(err) });
  }
});

// GET /api/bookings/vendor — get vendor's booking requests
router.get("/vendor/all", verifyToken, requireVendor, async (req: AuthRequest, res: Response) => {
  try {
    const snapshot = await db
      .collection("bookings")
      .where("vendorId", "==", req.user!.uid)
      .get();

    const bookings: Booking[] = [];
    snapshot.forEach((doc) => {
      bookings.push({ id: doc.id, ...doc.data() } as Booking);
    });
    bookings.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch bookings", error: String(err) });
  }
});

// PUT /api/bookings/:id/respond — vendor confirms/declines a booking
router.put("/:id/respond", verifyToken, requireVendor, async (req: AuthRequest, res: Response) => {
  try {
    const bookingId = req.params.id as string;
    const { status, vendorResponse } = req.body;

    if (!status || !["confirmed", "declined"].includes(status)) {
      res.status(400).json({ message: "Status must be 'confirmed' or 'declined'" });
      return;
    }

    const docRef = db.collection("bookings").doc(bookingId);
    const doc = await docRef.get();

    if (!doc.exists) {
      res.status(404).json({ message: "Booking not found" });
      return;
    }

    const booking = doc.data()!;
    if (booking.vendorId !== req.user!.uid) {
      res.status(403).json({ message: "You can only respond to your own bookings" });
      return;
    }

    await docRef.update({
      status,
      vendorResponse: vendorResponse || "",
    });

    const updated = await docRef.get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (err) {
    res.status(500).json({ message: "Failed to respond to booking", error: String(err) });
  }
});

export default router;
