import { Router, Response } from "express";
import { verifyToken, AuthRequest } from "../middleware/authMiddleware";

const router = Router();

// Public: verify a token and return user info
router.get("/me", verifyToken, (req: AuthRequest, res: Response) => {
  res.json({
    uid: req.user?.uid,
    email: req.user?.email,
    name: req.user?.name,
  });
});

// Protected route example
router.get("/profile", verifyToken, (req: AuthRequest, res: Response) => {
  res.json({
    message: "You have access to this protected route",
    user: req.user,
  });
});

export default router;
