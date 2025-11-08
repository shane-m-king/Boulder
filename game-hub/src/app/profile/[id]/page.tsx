"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/helpers/apiRequest";
import { toastAction } from "@/helpers/toastAction";
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
  const [editingBio, setEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState("");

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
          apiRequest< {user: UserProfile}>(`/api/users/${userId}`),
          apiRequest<UserGamesResponse>(
            `/api/users/${userId}/games?page=1&limit=2`
          ),
          apiRequest<ReviewsResponse>(`/api/users/${userId}/reviews`),
        ]);

        const fetchedUser = userData.user;
        setProfile(fetchedUser);
        setBioDraft(fetchedUser.bio || "");
        setRecentGames(gamesData.userGames);

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

  const handleSaveBio = async () => {
  try {
    const savePromise = apiRequest<{user: UserProfile}>(`/api/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ bio: bioDraft }),
    });

    const result = await toastAction(savePromise, {
      loading: "Saving bio...",
      success: "Bio updated successfully!",
      error: "Failed to update bio.",
    });

    const updatedUser = result?.user;
    if (updatedUser) {
      setProfile((prev) => (prev ? { ...prev, ...updatedUser } : updatedUser));
      setBioDraft(updatedUser.bio || "");
    }
  } catch (err) {
    console.error("Error saving bio:", err);
  } finally {
    setEditingBio(false); 
  }  
};


  // Loading Skeleton
  if (loading)
    return (
      <ProtectedRoute>
        <div className="max-w-5xl mx-auto py-10 px-4 text-foreground animate-pulse">
          <div className="bg-boulder-mid/40 border border-boulder-gold/20 rounded-xl p-6 mb-8">
            <div className="h-6 bg-boulder-mid/60 rounded w-1/3 mb-3"></div>
            <div className="h-4 bg-boulder-mid/60 rounded w-1/4 mb-4"></div>
            <div className="space-y-2">
              <div className="h-3 bg-boulder-mid/60 rounded w-full"></div>
              <div className="h-3 bg-boulder-mid/60 rounded w-5/6"></div>
              <div className="h-3 bg-boulder-mid/60 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );

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

          {/* Editable Bio Section */}
          {isCurrentUser ? (
            <div className="text-gray-300 leading-relaxed">
              {editingBio ? (
                <div className="space-y-3">
                  <textarea
                    value={bioDraft}
                    onChange={(e) => setBioDraft(e.target.value)}
                    className="w-full bg-boulder-mid/60 border border-boulder-gold/40 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-boulder-gold resize-none"
                    rows={3}
                    placeholder="Write something about yourself..."
                  />
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setEditingBio(false)}
                      className="px-3 py-1.5 text-sm rounded-md border border-boulder-gold/40 text-gray-400 hover:text-foreground hover:border-boulder-accent transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveBio}
                      className="px-4 py-1.5 text-sm font-semibold bg-boulder-gold text-boulder-dark rounded-md hover:bg-boulder-accent hover:shadow-lg transition-all cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : profile.bio?.trim() ? (
                <div className="flex justify-between items-start">
                  <p className="whitespace-pre-line">{profile.bio}</p>
                  <button
                    onClick={() => setEditingBio(true)}
                    className="text-xs text-boulder-accent underline ml-3 hover:text-boulder-gold transition cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-start italic text-gray-500">
                  <span>You haven’t added a bio yet.</span>
                  <button
                    onClick={() => setEditingBio(true)}
                    className="text-xs text-boulder-accent underline ml-3 hover:text-boulder-gold transition"
                  >
                    Add Bio
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-300 leading-relaxed">
              {profile.bio?.trim() ? (
                <>{profile.bio}</>
              ) : (
                <span className="italic text-gray-500">
                  This user hasn't added a bio yet.
                </span>
              )}
            </p>
          )}
        </div>

        {/* Recent Games + Reviews */}
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

        {/* Full Library Link */}
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
};

export default UserProfilePage;
