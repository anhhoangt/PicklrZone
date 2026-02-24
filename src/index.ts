import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initializeApp, cert, ServiceAccount } from "firebase-admin/app";
import authRoutes from "./routes/authRoutes";

dotenv.config();

// Initialize Firebase Admin (uses Application Default Credentials or service account)
if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH) as ServiceAccount;
  initializeApp({ credential: cert(serviceAccount) });
} else {
  initializeApp();
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/", (_req, res) => {
  res.json({ message: "Welcome to the PicklrZone API 🏓" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
