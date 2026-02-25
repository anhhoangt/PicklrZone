import { Router, Response } from "express";
import { db } from "../config/firebase";
import { verifyToken, AuthRequest } from "../middleware/authMiddleware";
import { UserProfile } from "../models/types";

const router = Router();

// GET /api/users/profile — get current user's profile
router.get("/profile", verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const docRef = db.collection("users").doc(req.user!.uid);
    const doc = await docRef.get();
    if (!doc.exists) {
      // Auto-create the profile so user is discoverable in message search
      const now = new Date().toISOString();
      const defaultProfile: UserProfile = {
        uid: req.user!.uid,
        email: req.user!.email || "",
        displayName: req.user!.name || req.user!.email || "",
        role: "user",
        bio: "",
        location: "",
        createdAt: now,
        updatedAt: now,
      };
      await docRef.set(defaultProfile);
      res.json(defaultProfile);
      return;
    }
    res.json({ uid: doc.id, ...doc.data() } as UserProfile);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profile", error: String(err) });
  }
});

// PUT /api/users/profile — create or update current user's profile
router.put("/profile", verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { displayName, role, bio, location, photoURL } = req.body;

    if (role && role !== "user" && role !== "vendor") {
      res.status(400).json({ message: "Role must be 'user' or 'vendor'" });
      return;
    }

    const docRef = db.collection("users").doc(req.user!.uid);
    const doc = await docRef.get();
    const now = new Date().toISOString();

    if (doc.exists) {
      const updates: Record<string, unknown> = { updatedAt: now };
      if (displayName !== undefined) updates.displayName = displayName;
      if (role !== undefined) updates.role = role;
      if (bio !== undefined) updates.bio = bio;
      if (location !== undefined) updates.location = location;
      if (photoURL !== undefined) updates.photoURL = photoURL;

      await docRef.update(updates);
    } else {
      const profileData: UserProfile = {
        uid: req.user!.uid,
        email: req.user!.email || "",
        displayName: displayName || req.user!.name || "",
        photoURL: photoURL || "",
        role: role || "user",
        bio: bio || "",
        location: location || "",
        createdAt: now,
        updatedAt: now,
      };
      await docRef.set(profileData);
    }

    const updated = await docRef.get();
    res.json({ uid: updated.id, ...updated.data() });
  } catch (err) {
    res.status(500).json({ message: "Failed to update profile", error: String(err) });
  }
});

// GET /api/users/:uid — get a user's public profile
router.get("/:uid", async (req, res: Response) => {
  try {
    const uid = req.params.uid as string;
    const doc = await db.collection("users").doc(uid).get();
    if (!doc.exists) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    const data = doc.data()!;
    // Return only public fields
    res.json({
      uid: doc.id,
      displayName: data.displayName,
      photoURL: data.photoURL,
      role: data.role,
      bio: data.bio,
      location: data.location,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user", error: String(err) });
  }
});

export default router;
