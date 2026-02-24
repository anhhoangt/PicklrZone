import React, { createContext, useContext, useState, useEffect } from "react";
import { Course, CartItem } from "../types";

interface CartContextType {
  items: CartItem[];
  addToCart: (course: Course) => void;
  removeFromCart: (courseId: string) => void;
  clearCart: () => void;
  isInCart: (courseId: string) => boolean;
  totalPrice: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

const CART_STORAGE_KEY = "picklrzone_cart";

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = (course: Course) => {
    if (items.some((item) => item.course.id === course.id)) return;
    setItems((prev) => [...prev, { course, addedAt: new Date().toISOString() }]);
  };

  const removeFromCart = (courseId: string) => {
    setItems((prev) => prev.filter((item) => item.course.id !== courseId));
  };

  const clearCart = () => setItems([]);

  const isInCart = (courseId: string) => items.some((item) => item.course.id === courseId);

  const totalPrice = items.reduce((sum, item) => sum + item.course.price, 0);

  const itemCount = items.length;

  return (
    <CartContext.Provider
      value={{ items, addToCart, removeFromCart, clearCart, isInCart, totalPrice, itemCount }}
    >
      {children}
    </CartContext.Provider>
  );
};
