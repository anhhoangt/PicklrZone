import { Request, Response, NextFunction } from "express";
import { getAuth } from "firebase-admin/auth";
import { db } from "../config/firebase";
import { UserRole } from "../models/types";

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string | undefined;
    name: string | undefined;
    role?: UserRole;
  };
}

export const verifyToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized: No token provided" });
    return;
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    const decoded = await getAuth().verifyIdToken(token);

    // Try to get user profile for role info
    const userDoc = await db.collection("users").doc(decoded.uid).get();
    const userData = userDoc.data();

    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
      role: userData?.role || "user",
    };
    next();
  } catch {
    res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

export const requireVendor = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.user?.role !== "vendor") {
    res.status(403).json({ message: "Forbidden: Vendor access required" });
    return;
  }
  next();
};
