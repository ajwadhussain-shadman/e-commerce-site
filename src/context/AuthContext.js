"use client";

import React, { createContext, useContext } from "react";
import { authClient } from "../../lib/auth-client";
import { useToast } from "./ToastContext";

const AuthContext = createContext(null);

function assertAuthSuccess(result, fallbackMessage) {
  if (result.error) {
    throw new Error(result.error.message || fallbackMessage);
  }

  return result.data;
}

export function AuthProvider({ children }) {
  const { addToast } = useToast();
  const { data: session, isPending, error: sessionError, refetch } = authClient.useSession();
  const user = session?.user
    ? {
        ...session.user,
        phone: session.user.phone || "",
        district: session.user.district || "",
        area: session.user.area || "",
        address: session.user.address || "",
      }
    : null;

  const login = async (email, password) => {
    const data = assertAuthSuccess(
      await authClient.signIn.email({ email, password }),
      "Sign in failed. Please check your details and try again."
    );
    await refetch();
    addToast(`Welcome back, ${data?.user?.name || email}!`, "success");
    return true;
  };

  const register = async (name, email, phone, password) => {
    const data = assertAuthSuccess(
      await authClient.signUp.email({ name, email, phone, password }),
      "Registration failed. Please review your details and try again."
    );
    await refetch();
    addToast(`Account created successfully! Welcome, ${data?.user?.name || name}.`, "success");
    return true;
  };

  const logout = async () => {
    try {
      assertAuthSuccess(await authClient.signOut(), "Sign out failed. Please try again.");
      await refetch();
      addToast("Logged out successfully", "info");
      return true;
    } catch (error) {
      addToast(error.message || "Sign out failed. Please try again.", "error");
      return false;
    }
  };

  const updateProfile = async (data) => {
    try {
      assertAuthSuccess(
        await authClient.updateUser({
          name: data.name,
          phone: data.phone,
          district: data.district,
          area: data.area,
          address: data.address,
        }),
        "Profile update failed. Please try again."
      );
      await refetch();
      addToast("Profile updated successfully", "success");
      return true;
    } catch (error) {
      addToast(error.message || "Profile update failed. Please try again.", "error");
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        sessionError,
        isAuthenticated: Boolean(session?.user),
        login,
        register,
        logout,
        updateProfile,
        refreshSession: refetch,
        isLoaded: !isPending,
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
