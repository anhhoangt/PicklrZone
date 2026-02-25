import { Router, Response } from "express";
import { db } from "../config/firebase";
import { verifyToken, AuthRequest } from "../middleware/authMiddleware";
import { Conversation, Message } from "../models/types";

const router = Router();

// GET /api/messages/users/search?q=query — search users to message
router.get("/users/search", verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const q = (req.query.q as string || "").toLowerCase().trim();
    if (!q || q.length < 2) {
      res.json([]);
      return;
    }

    // Search Firestore users collection
    const snapshot = await db.collection("users").get();
    const users: any[] = [];
    const seenUids = new Set<string>();

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (doc.id === req.user!.uid) return;
      const name = (data.displayName || "").toLowerCase();
      const email = (data.email || "").toLowerCase();
      if (name.includes(q) || email.includes(q)) {
        seenUids.add(doc.id);
        users.push({
          uid: doc.id,
          displayName: data.displayName || data.email,
          email: data.email,
          photoURL: data.photoURL || "",
          role: data.role || "user",
        });
      }
    });

    // Also search Firebase Auth users (for users who haven't saved a profile yet)
    try {
      const { getAuth } = require("firebase-admin/auth");
      const listResult = await getAuth().listUsers(100);
      listResult.users.forEach((userRecord: any) => {
        if (userRecord.uid === req.user!.uid) return;
        if (seenUids.has(userRecord.uid)) return;
        const name = (userRecord.displayName || "").toLowerCase();
        const email = (userRecord.email || "").toLowerCase();
        if (name.includes(q) || email.includes(q)) {
          users.push({
            uid: userRecord.uid,
            displayName: userRecord.displayName || userRecord.email,
            email: userRecord.email,
            photoURL: userRecord.photoURL || "",
            role: "user",
          });
        }
      });
    } catch (authErr) {
      console.error("Firebase Auth listUsers fallback failed:", authErr);
    }

    res.json(users.slice(0, 20));
  } catch (err) {
    res.status(500).json({ message: "Failed to search users", error: String(err) });
  }
});

// GET /api/messages/conversations — get user's conversations
router.get("/conversations", verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const snapshot = await db
      .collection("conversations")
      .where("participants", "array-contains", req.user!.uid)
      .get();

    const conversations: Conversation[] = [];
    snapshot.forEach((doc) => {
      conversations.push({ id: doc.id, ...doc.data() } as Conversation);
    });
    conversations.sort((a, b) => (b.lastMessageAt || b.createdAt || "").localeCompare(a.lastMessageAt || a.createdAt || ""));
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch conversations", error: String(err) });
  }
});

// POST /api/messages/conversations — create a new conversation
router.post("/conversations", verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { type, name, participantUids } = req.body as {
      type: "dm" | "group";
      name?: string;
      participantUids: string[];
    };

    if (!participantUids || participantUids.length === 0) {
      res.status(400).json({ message: "At least one participant is required" });
      return;
    }

    // Always include the creator
    const allParticipants = Array.from(new Set([req.user!.uid, ...participantUids]));

    if (type === "dm" && allParticipants.length !== 2) {
      res.status(400).json({ message: "DM must have exactly 2 participants" });
      return;
    }

    if (type === "group" && !name) {
      res.status(400).json({ message: "Group chat requires a name" });
      return;
    }

    // For DM, check if conversation already exists
    if (type === "dm") {
      const existing = await db
        .collection("conversations")
        .where("participants", "array-contains", req.user!.uid)
        .get();

      const otherUid = allParticipants.find((uid) => uid !== req.user!.uid)!;
      for (const doc of existing.docs) {
        const data = doc.data();
        if (data.type === "dm" && data.participants.includes(otherUid)) {
          res.json({ id: doc.id, ...data });
          return;
        }
      }
    }

    // Fetch participant names and photos
    const participantNames: Record<string, string> = {};
    const participantPhotos: Record<string, string> = {};
    for (const uid of allParticipants) {
      const userDoc = await db.collection("users").doc(uid).get();
      const userData = userDoc.data();
      participantNames[uid] = userData?.displayName || userData?.email || "User";
      participantPhotos[uid] = userData?.photoURL || "";
    }

    const now = new Date().toISOString();
    const lastReadAt: Record<string, string> = {};
    for (const uid of allParticipants) {
      lastReadAt[uid] = now;
    }

    const conversationData: Record<string, any> = {
      type,
      participants: allParticipants,
      participantNames,
      participantPhotos,
      lastReadAt,
      createdBy: req.user!.uid,
      createdAt: now,
    };
    if (type === "group" && name) {
      conversationData.name = name;
    }

    const docRef = await db.collection("conversations").add(conversationData);
    res.status(201).json({ id: docRef.id, ...conversationData });
  } catch (err) {
    res.status(500).json({ message: "Failed to create conversation", error: String(err) });
  }
});

// GET /api/messages/conversations/:id/messages — get messages
router.get("/conversations/:id/messages", verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const conversationId = req.params.id as string;

    // Verify participant
    const convDoc = await db.collection("conversations").doc(conversationId).get();
    if (!convDoc.exists) {
      res.status(404).json({ message: "Conversation not found" });
      return;
    }
    const convData = convDoc.data()!;
    if (!convData.participants.includes(req.user!.uid)) {
      res.status(403).json({ message: "You are not a participant" });
      return;
    }

    const snapshot = await db
      .collection("conversations")
      .doc(conversationId)
      .collection("messages")
      .get();

    const messages: Message[] = [];
    snapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() } as Message);
    });
    messages.sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch messages", error: String(err) });
  }
});

// POST /api/messages/conversations/:id/messages — send a message
router.post("/conversations/:id/messages", verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const conversationId = req.params.id as string;
    const { text } = req.body;

    if (!text || !text.trim()) {
      res.status(400).json({ message: "Message text is required" });
      return;
    }

    // Verify participant
    const convRef = db.collection("conversations").doc(conversationId);
    const convDoc = await convRef.get();
    if (!convDoc.exists) {
      res.status(404).json({ message: "Conversation not found" });
      return;
    }
    const convData = convDoc.data()!;
    if (!convData.participants.includes(req.user!.uid)) {
      res.status(403).json({ message: "You are not a participant" });
      return;
    }

    // Get sender info
    const userDoc = await db.collection("users").doc(req.user!.uid).get();
    const userData = userDoc.data();

    const now = new Date().toISOString();
    const messageData: Omit<Message, "id"> = {
      conversationId,
      senderId: req.user!.uid,
      senderName: userData?.displayName || req.user!.name || "User",
      senderPhotoURL: userData?.photoURL || "",
      text: text.trim(),
      createdAt: now,
    };

    const msgRef = await convRef.collection("messages").add(messageData);

    // Update conversation's last message and mark as read for sender
    await convRef.update({
      lastMessage: text.trim().substring(0, 100),
      lastMessageBy: req.user!.uid,
      lastMessageAt: now,
      [`lastReadAt.${req.user!.uid}`]: now,
    });

    res.status(201).json({ id: msgRef.id, ...messageData });
  } catch (err) {
    res.status(500).json({ message: "Failed to send message", error: String(err) });
  }
});

// PUT /api/messages/conversations/:id/read — mark conversation as read
router.put("/conversations/:id/read", verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const conversationId = req.params.id as string;
    const convRef = db.collection("conversations").doc(conversationId);
    const convDoc = await convRef.get();

    if (!convDoc.exists) {
      res.status(404).json({ message: "Conversation not found" });
      return;
    }

    const convData = convDoc.data()!;
    if (!convData.participants.includes(req.user!.uid)) {
      res.status(403).json({ message: "You are not a participant" });
      return;
    }

    await convRef.update({
      [`lastReadAt.${req.user!.uid}`]: new Date().toISOString(),
    });

    res.json({ message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Failed to mark as read", error: String(err) });
  }
});

export default router;
