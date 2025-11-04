"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If loading completes and no user is found, redirect to login
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Show loading during check
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-boulder-dark text-foreground">
        <p className="text-lg font-body text-boulder-gold animate-pulse">
          Authenticating...
        </p>
      </div>
    );
  }

  if (user) return <>{children}</>;

  // If not authenticated, render nothing while redirecting
  return null;
}
