import { Router, Response } from "express";
import Stripe from "stripe";
import { db } from "../config/firebase";
import { verifyToken, AuthRequest } from "../middleware/authMiddleware";
import dotenv from "dotenv";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

const router = Router();

// POST /api/payments/create-checkout-session — create Stripe checkout session
router.post("/create-checkout-session", verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { items } = req.body as {
      items: { courseId: string; title: string; price: number; thumbnailUrl?: string }[];
    };

    if (!items || items.length === 0) {
      res.status(400).json({ message: "No items provided" });
      return;
    }

    // Verify courses exist and user hasn't already purchased them
    for (const item of items) {
      const courseDoc = await db.collection("courses").doc(item.courseId).get();
      if (!courseDoc.exists) {
        res.status(404).json({ message: `Course not found: ${item.courseId}` });
        return;
      }

      const existing = await db
        .collection("enrollments")
        .where("userId", "==", req.user!.uid)
        .where("courseId", "==", item.courseId)
        .get();

      if (!existing.empty) {
        res.status(400).json({ message: `Already enrolled in: ${item.title}` });
        return;
      }
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.title,
          images: item.thumbnailUrl ? [item.thumbnailUrl] : [],
        },
        unit_amount: Math.round(item.price * 100), // cents
      },
      quantity: 1,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL || "http://localhost:3000"}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL || "http://localhost:3000"}/cart`,
      metadata: {
        userId: req.user!.uid,
        courseIds: items.map((i) => i.courseId).join(","),
      },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({ message: "Failed to create checkout session", error: String(err) });
  }
});

// POST /api/payments/confirm — confirm payment and create enrollments
router.post("/confirm", verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      res.status(400).json({ message: "Session ID required" });
      return;
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId as string);

    if (session.payment_status !== "paid") {
      res.status(400).json({ message: "Payment not completed" });
      return;
    }

    const userId = session.metadata?.userId;
    const courseIds = session.metadata?.courseIds?.split(",") || [];

    if (userId !== req.user!.uid) {
      res.status(403).json({ message: "Session does not belong to this user" });
      return;
    }

    // Create enrollments for each course
    const enrollments = [];
    for (const courseId of courseIds) {
      // Check if already enrolled (prevent double enrollment)
      const existing = await db
        .collection("enrollments")
        .where("userId", "==", userId)
        .where("courseId", "==", courseId)
        .get();

      if (!existing.empty) continue;

      const courseDoc = await db.collection("courses").doc(courseId).get();
      const courseData = courseDoc.data();

      const enrollment = {
        userId,
        courseId,
        courseTitle: courseData?.title || "",
        purchasedAt: new Date().toISOString(),
        stripeSessionId: sessionId,
      };

      const docRef = await db.collection("enrollments").add(enrollment);
      enrollments.push({ id: docRef.id, ...enrollment });

      // Increment student count
      if (courseDoc.exists) {
        await db.collection("courses").doc(courseId).update({
          totalStudents: (courseData?.totalStudents || 0) + 1,
        });
      }
    }

    res.json({ enrollments });
  } catch (err) {
    console.error("Confirm error:", err);
    res.status(500).json({ message: "Failed to confirm payment", error: String(err) });
  }
});

// GET /api/payments/enrollments — get user's enrolled courses
router.get("/enrollments", verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const snapshot = await db
      .collection("enrollments")
      .where("userId", "==", req.user!.uid)
      .get();

    const enrollments: any[] = [];
    snapshot.forEach((doc) => {
      enrollments.push({ id: doc.id, ...doc.data() });
    });

    // Sort by purchasedAt descending in code (avoids needing composite index)
    enrollments.sort((a, b) => (b.purchasedAt || "").localeCompare(a.purchasedAt || ""));

    res.json(enrollments);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch enrollments", error: String(err) });
  }
});

export default router;
