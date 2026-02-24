import { initializeApp, cert, ServiceAccount, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

if (getApps().length === 0) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const serviceAccount = require(
      path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
    ) as ServiceAccount;
    initializeApp({ credential: cert(serviceAccount) });
  } else {
    initializeApp();
  }
}

export const db = getFirestore();
