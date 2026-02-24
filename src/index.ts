import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import "./config/firebase";
import authRoutes from "./routes/authRoutes";
import courseRoutes from "./routes/courseRoutes";
import reviewRoutes from "./routes/reviewRoutes";
import userRoutes from "./routes/userRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import submissionRoutes from "./routes/submissionRoutes";
import bookingRoutes from "./routes/bookingRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/users", userRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/bookings", bookingRoutes);

app.get("/", (_req, res) => {
  res.json({ message: "Welcome to the PicklrZone API 🏓" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
