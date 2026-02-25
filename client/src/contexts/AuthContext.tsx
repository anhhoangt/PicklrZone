import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "../config/firebase";
import { UserRole } from "../types";

interface AuthContextType {
  currentUser: User | null;
  userRole: UserRole;
  loading: boolean;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const ensureUserProfile = async (user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null }) => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) return;
    await fetch(`${API_URL}/api/users/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        displayName: user.displayName || user.email || "",
        photoURL: user.photoURL || "",
      }),
    });
  } catch (err) {
    console.error("Error ensuring user profile:", err);
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>("user");
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (user: User) => {
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const profile = await res.json();
        setUserRole(profile.role || "user");
      }
    } catch {
      setUserRole("user");
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchProfile(user);
      } else {
        setUserRole("user");
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [fetchProfile]);

  const refreshProfile = async () => {
    if (currentUser) {
      await fetchProfile(currentUser);
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName });
    await ensureUserProfile({
      uid: credential.user.uid,
      email: credential.user.email,
      displayName,
      photoURL: credential.user.photoURL,
    });
  };

  const loginWithEmail = async (email: string, password: string) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    await ensureUserProfile({
      uid: credential.user.uid,
      email: credential.user.email,
      displayName: credential.user.displayName,
      photoURL: credential.user.photoURL,
    });
  };

  const loginWithGoogle = async () => {
    const credential = await signInWithPopup(auth, googleProvider);
    await ensureUserProfile({
      uid: credential.user.uid,
      email: credential.user.email,
      displayName: credential.user.displayName,
      photoURL: credential.user.photoURL,
    });
  };

  const logout = async () => {
    await signOut(auth);
    setUserRole("user");
  };

  const value: AuthContextType = {
    currentUser,
    userRole,
    loading,
    signUpWithEmail,
    loginWithEmail,
    loginWithGoogle,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
