import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { createCheckoutSession } from "../services/api";
import StarRating from "../components/StarRating";
import "./Cart.css";

const Cart: React.FC = () => {
  const { items, removeFromCart, clearCart, totalPrice, itemCount } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleCheckout = async () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const checkoutItems = items.map((item) => ({
        courseId: item.course.id,
        title: item.course.title,
        price: item.course.price,
        thumbnailUrl: item.course.thumbnailUrl,
      }));

      const { url } = await createCheckoutSession(checkoutItems);
      if (url) {
        window.location.href = url;
      }
    } catch (err: any) {
      setError(err.message || "Failed to create checkout session");
    }
    setLoading(false);
  };

  if (itemCount === 0) {
    return (
      <div className="cart-empty">
        <span>🛒</span>
        <h2>Your Cart is Empty</h2>
        <p>Browse courses and add them to your cart.</p>
        <Link to="/courses" className="btn-app btn-app-filled">
          <span className="btn-ball">🏓</span>
          Browse Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>Shopping Cart</h1>
      <p className="cart-count">{itemCount} course{itemCount !== 1 ? "s" : ""} in cart</p>

      {error && <div className="cart-error">{error}</div>}

      <div className="cart-layout">
        {/* Cart items */}
        <div className="cart-items">
          {items.map((item) => (
            <div key={item.course.id} className="cart-item">
              <Link to={`/courses/${item.course.id}`} className="cart-item-thumb">
                {item.course.thumbnailUrl ? (
                  <img src={item.course.thumbnailUrl} alt="" />
                ) : (
                  <div className="cart-item-thumb-placeholder">🏓</div>
                )}
              </Link>

              <div className="cart-item-info">
                <Link to={`/courses/${item.course.id}`} className="cart-item-title">
                  {item.course.title}
                </Link>
                <p className="cart-item-vendor">by {item.course.vendorName}</p>
                <div className="cart-item-meta">
                  <StarRating rating={item.course.averageRating} size={12} />
                  <span>{item.course.averageRating > 0 ? item.course.averageRating.toFixed(1) : "New"}</span>
                  <span className="cart-item-dot">•</span>
                  <span>{item.course.lessons?.length || 0} lessons</span>
                  <span className="cart-item-dot">•</span>
                  <span>{item.course.level}</span>
                </div>
              </div>

              <div className="cart-item-right">
                <span className="cart-item-price">
                  {item.course.price === 0 ? "Free" : `$${item.course.price.toFixed(2)}`}
                </span>
                <button
                  onClick={() => removeFromCart(item.course.id)}
                  className="cart-item-remove"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Checkout summary */}
        <div className="cart-summary">
          <h3>Order Summary</h3>

          <div className="cart-summary-rows">
            {items.map((item) => (
              <div key={item.course.id} className="cart-summary-row">
                <span className="cart-summary-name">{item.course.title}</span>
                <span className="cart-summary-price">
                  {item.course.price === 0 ? "Free" : `$${item.course.price.toFixed(2)}`}
                </span>
              </div>
            ))}
          </div>

          <div className="cart-summary-total">
            <span>Total</span>
            <span className="cart-total-price">${totalPrice.toFixed(2)}</span>
          </div>

          <button
            className="btn-app btn-app-filled cart-checkout-btn"
            onClick={handleCheckout}
            disabled={loading}
          >
            <span className="btn-ball">🏓</span>
            {loading ? "Redirecting to Stripe..." : "Proceed to Checkout"}
          </button>

          <button onClick={clearCart} className="cart-clear-btn">
            Clear Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
