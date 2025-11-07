"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/helpers/apiRequest";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import UserGameCard from "@/app/components/UserGameCard";
import toast from "react-hot-toast";
import Link from "next/link";

interface UserProfile {
  _id: string;
  username: string;
  bio?: string;
  createdAt?: string;
}

interface Game {
  _id: string;
  title: string;
  thumbnailUrl?: string;
}

interface UserGame {
  _id: string;
  status: string;
  notes?: string;
  updatedAt: string;
  game: Game;
}

interface Review {
  _id: string;
  title: string;
  reviewBody: string;
  rating: number;
  game: { _id: string };
}

interface UserGamesResponse {
  userGames: UserGame[];
}

interface ReviewsResponse {
  reviews: Review[];
}

export const UserProfilePage = ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { user } = useAuth();
  const [userId, setUserId] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recentGames, setRecentGames] = useState<UserGame[]>([]);
  const [reviewsMap, setReviewsMap] = useState<Map<string, Review>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Resolve params
  useEffect(() => {
    (async () => {
      const { id } = await params;
      setUserId(id);
    })();
  }, [params]);

  // Fetch user info, games, and reviews
  useEffect(() => {
    if (!userId) return;

    const fetchUserProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const [userData, gamesData, reviewsData] = await Promise.all([
          apiRequest<{ user: UserProfile }>(`/api/users/${userId}`),
          apiRequest<UserGamesResponse>(
            `/api/users/${userId}/games?page=1&limit=2`
          ),
          apiRequest<ReviewsResponse>(`/api/users/${userId}/reviews`),
        ]);

        setProfile(userData.user);
        setRecentGames(gamesData.userGames);

        // Build gameId → review map
        const map = new Map<string, Review>();
        for (const review of reviewsData.reviews) {
          if (review.game?._id) map.set(review.game._id, review);
        }
        setReviewsMap(map);
      } catch (err: any) {
        console.error("Error loading profile:", err);
        setError(err.message || "Failed to load user profile.");
        toast.error(err.message || "Failed to load user profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  const isCurrentUser = user?.id === profile?._id;

  /* =============================
        LOADING SKELETON
     ============================= */
  if (loading)
    return (
      <ProtectedRoute>
        <div className="max-w-5xl mx-auto py-10 px-4 text-foreground animate-pulse">
          {/* Profile Skeleton */}
          <div className="bg-boulder-mid/40 border border-boulder-gold/20 rounded-xl p-6 mb-8">
            <div className="h-6 bg-boulder-mid/60 rounded w-1/3 mb-3"></div>
            <div className="h-4 bg-boulder-mid/60 rounded w-1/4 mb-4"></div>
            <div className="space-y-2">
              <div className="h-3 bg-boulder-mid/60 rounded w-full"></div>
              <div className="h-3 bg-boulder-mid/60 rounded w-5/6"></div>
              <div className="h-3 bg-boulder-mid/60 rounded w-2/3"></div>
            </div>
          </div>

          {/* Game Cards Skeleton */}
          <div className="space-y-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col md:flex-row bg-boulder-mid/40 border border-boulder-gold/20 rounded-xl overflow-hidden"
              >
                <div className="md:w-1/4 w-full aspect-video bg-boulder-mid relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-boulder-gold/10 to-transparent animate-[shimmer_2s_infinite]" />
                </div>
                <div className="flex-1 p-5 space-y-3">
                  <div className="h-4 w-2/3 bg-boulder-mid/60 rounded"></div>
                  <div className="h-3 w-1/2 bg-boulder-mid/60 rounded"></div>
                  <div className="h-3 w-full bg-boulder-mid/60 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ProtectedRoute>
    );

  /* =============================
         ERROR & FALLBACKS
     ============================= */
  if (error)
    return (
      <ProtectedRoute>
        <p className="text-center text-red-400 mt-10">{error}</p>
      </ProtectedRoute>
    );

  if (!profile)
    return (
      <ProtectedRoute>
        <p className="text-center text-gray-400 mt-10">User not found.</p>
      </ProtectedRoute>
    );

  /* =============================
           MAIN PROFILE VIEW
     ============================= */
  return (
    <ProtectedRoute>
      <div className="max-w-5xl mx-auto py-10 px-4 text-foreground">
        {/* === User Info === */}
        <div className="bg-boulder-mid/50 border border-boulder-gold/20 rounded-xl p-6 mb-8 shadow-md">
          <h1 className="font-display text-3xl font-bold text-boulder-gold mb-2 text-center sm:text-left">
            {profile.username}
          </h1>
          <p className="text-gray-400 text-sm mb-4 text-center sm:text-left">
            Member since{" "}
            {profile.createdAt
              ? new Date(profile.createdAt).toLocaleDateString()
              : "Unknown"}
          </p>

          <p className="text-gray-300 leading-relaxed">
            {profile.bio?.trim() ? (
              <>{profile.bio}</>
            ) : (
              <span className="italic text-gray-500">
                {isCurrentUser
                  ? "You haven’t added a bio yet."
                  : "This user hasn’t added a bio yet."}
              </span>
            )}
          </p>
        </div>

        {/* === Recent Games + Reviews === */}
        <div>
          <h2 className="font-display text-2xl text-boulder-accent mb-4">
            {isCurrentUser ? "Your Recent Games" : "Recent Games"}
          </h2>

          {recentGames.length > 0 ? (
            <div className="flex flex-col gap-6">
              {recentGames.map((userGame) => (
                <UserGameCard
                  key={userGame._id}
                  userId={userId}
                  userGame={userGame}
                  review={reviewsMap.get(userGame.game._id) || null}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-400 italic text-center sm:text-left">
              {isCurrentUser
                ? "You have no games in your library yet."
                : "This user has no games in their library yet."}
            </p>
          )}
        </div>

        {/* === Full Library Link === */}
        <div className="text-center sm:text-right mt-10">
          <Link
            href={`/profile/${userId}/games`}
            className="text-boulder-gold font-medium hover:text-boulder-accent transition-all text-sm"
          >
            View All Games →
          </Link>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default UserProfilePage;