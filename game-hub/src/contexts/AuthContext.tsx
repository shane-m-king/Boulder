"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatRetryAfter } from "@/helpers/retryAfter";

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch the current user from the auth cookie (shared by the initial
  // load and refreshUser)
  const fetchUser = useCallback(async () => {
    const res = await fetch("/api/auth/verify", {
      method: "GET",
      credentials: "include",
    });

    if (res.ok) {
      const data = await res.json();
      setUser(data.data.user);
    } else {
      setUser(null);
    }
  }, []);

  // Load user from cookie
  useEffect(() => {
    const loadUser = async () => {
      try {
        await fetchUser();
      } catch (error) {
        console.error("Error verifying user:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [fetchUser]);

// Login
const login = async (username: string, password: string) => {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      if (res.status === 429) {
        const retryAfter = Number(res.headers.get("Retry-After"));
        throw new Error(
          `Too many attempts. Please try again in ${formatRetryAfter(retryAfter)}.`
        );
      }
      throw new Error(data.error || "Login failed");
    }

    // Navigation is left to the calling page (login/register redirect
    // straight to /profile/{id} once user state is set)
    setUser(data.data);
  } catch (error: any) {
    console.error("Login failed:", error);
    throw error;
  }
};


  // Logout
  const logout = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        setUser(null);
        router.push("/login");
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Refresh user (network errors keep the current user rather than
  // logging out on a blip)
  const refreshUser = async () => {
    try {
      await fetchUser();
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context)
      throw new Error("useAuth must be used within an AuthProvider");
    return context;
};