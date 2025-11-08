"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import toast from "react-hot-toast";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if no user found
    if (!loading && !user) {
      setTimeout(() => router.push("/login"), 50);
      // toast.error("Must be logged in"); Eventually can have this, but not triggering on regular logouts.
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

export default ProtectedRoute;