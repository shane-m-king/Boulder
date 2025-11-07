"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";

export const ProfileRedirectPage = () => {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Redirect to users profile
  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace(`/profile/${user.id}`);
      } else {
        router.replace("/login");
      }
    }
  }, [user, loading, router]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Redirecting...
      </div>
    </ProtectedRoute>
  );
}

export default ProfileRedirectPage;
