"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { authApi } from "@/lib/api";
import { AuthUser, LoginRequest, RegisterRequest } from "@/lib/types";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<{ success: boolean; message: string }>;
  register: (data: RegisterRequest) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("token");
    if (stored) {
      try {
        const decoded = jwtDecode<AuthUser>(stored);
        setToken(stored); // eslint-disable-line react-hooks/set-state-in-effect
        setUser(decoded);
      } catch {
        localStorage.removeItem("token");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (data: LoginRequest) => {
    const res = await authApi.login(data);
    if (res.success && res.data?.token) {
      const decoded = jwtDecode<AuthUser>(res.data.token);
      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
      setUser(decoded);
      return { success: true, message: "Login successful" };
    }
    return { success: false, message: res.message };
  };

  const register = async (data: RegisterRequest) => {
    const res = await authApi.registerCompany(data);
    return { success: res.success, message: res.message };
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
