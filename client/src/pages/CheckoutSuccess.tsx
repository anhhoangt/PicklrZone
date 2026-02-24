import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { confirmPayment } from "../services/api";
import { useCart } from "../contexts/CartContext";
import "./CheckoutSuccess.css";

const CheckoutSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) {
      setStatus("error");
      setError("No session ID found");
      return;
    }

    const confirm = async () => {
      try {
        await confirmPayment(sessionId);
        clearCart();
        setStatus("success");
      } catch (err: any) {
        setError(err.message || "Failed to confirm payment");
        setStatus("error");
      }
    };

    confirm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  if (status === "loading") {
    return (
      <div className="checkout-result">
        <span className="bounce-ball">🏓</span>
        <h2>Confirming your purchase...</h2>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="checkout-result">
        <span className="checkout-icon">❌</span>
        <h2>Something went wrong</h2>
        <p>{error}</p>
        <Link to="/courses" className="btn-app btn-app-filled">
          <span className="btn-ball">🏓</span>
          Browse Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="checkout-result">
      <span className="checkout-icon">🎉</span>
      <h2>Purchase Successful!</h2>
      <p>You're enrolled! Time to level up your pickleball game.</p>
      <div className="checkout-actions">
        <Link to="/my-learning" className="btn-app btn-app-filled">
          <span className="btn-ball">🏓</span>
          Go to My Learning
        </Link>
        <Link to="/courses" className="btn-app btn-app-outline">
          Browse More Courses
        </Link>
      </div>
    </div>
  );
};

export default CheckoutSuccess;
