"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "./ToastContext";

const AuthContext = createContext(null);
const AUTH_STORAGE_KEY = "novella_demo_user";

const DEMO_USER = {
  id: "usr-demo-01",
  name: "Tanvir Ahmed",
  email: "tanvir.ahmed@example.com",
  phone: "+880 1712 345678",
  district: "Dhaka",
  area: "Banani",
  address: "House 42, Road 11, Block D",
  joinedDate: "January 2026",
  role: "customer"
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        // Default to demo user for client presentation
        setUser(DEMO_USER);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(DEMO_USER));
      }
    } catch (e) {
      console.warn("Could not load user from storage", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const login = async (email, password) => {
    // Simulated authentication for demo
    const loggedInUser = {
      ...DEMO_USER,
      email: email || DEMO_USER.email,
      name: email.split("@")[0].replace(".", " ").replace(/(^\w|\s\w)/g, m => m.toUpperCase())
    };
    setUser(loggedInUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(loggedInUser));
    addToast(`Welcome back, ${loggedInUser.name}!`, "success");
    return true;
  };

  const register = async (name, email, phone) => {
    const newUser = {
      id: `usr-${Date.now()}`,
      name,
      email,
      phone,
      district: "Dhaka",
      area: "Gulshan",
      address: "Demo Address",
      joinedDate: "Just now",
      role: "customer"
    };
    setUser(newUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
    addToast(`Account created successfully! Welcome, ${name}`, "success");
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    addToast("Logged out successfully", "info");
  };

  const updateProfile = (data) => {
    setUser(prev => {
      const updated = { ...prev, ...data };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    addToast("Profile updated successfully", "success");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateProfile,
        isLoaded
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
