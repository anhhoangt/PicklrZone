import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Marketplace from "./pages/Marketplace";
import CourseDetail from "./pages/CourseDetail";
import VendorDashboard from "./pages/VendorDashboard";
import CourseForm from "./pages/CourseForm";
import Profile from "./pages/Profile";
import Cart from "./pages/Cart";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import CourseLearning from "./pages/CourseLearning";
import MyLearning from "./pages/MyLearning";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Layout>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/courses" element={<Marketplace />} />
              <Route path="/courses/:id" element={<CourseDetail />} />
              <Route path="/cart" element={<Cart />} />

              {/* Protected */}
              <Route
                path="/checkout/success"
                element={<ProtectedRoute><CheckoutSuccess /></ProtectedRoute>}
              />
              <Route
                path="/my-learning"
                element={<ProtectedRoute><MyLearning /></ProtectedRoute>}
              />
              <Route
                path="/learn/:courseId"
                element={<ProtectedRoute><CourseLearning /></ProtectedRoute>}
              />
              <Route
                path="/profile"
                element={<ProtectedRoute><Profile /></ProtectedRoute>}
              />
              <Route
                path="/vendor/dashboard"
                element={<ProtectedRoute><VendorDashboard /></ProtectedRoute>}
              />
              <Route
                path="/vendor/courses/new"
                element={<ProtectedRoute><CourseForm /></ProtectedRoute>}
              />
              <Route
                path="/vendor/courses/:id/edit"
                element={<ProtectedRoute><CourseForm /></ProtectedRoute>}
              />

              {/* Default redirect */}
              <Route path="*" element={<Navigate to="/courses" />} />
            </Routes>
          </Layout>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
