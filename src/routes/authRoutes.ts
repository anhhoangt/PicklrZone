import { Router, Response } from "express";
import { verifyToken, AuthRequest } from "../middleware/authMiddleware";

const router = Router();

router.get("/me", verifyToken, (req: AuthRequest, res: Response) => {
  res.json({
    uid: req.user?.uid,
    email: req.user?.email,
    name: req.user?.name,
    role: req.user?.role,
  });
});

export default router;
