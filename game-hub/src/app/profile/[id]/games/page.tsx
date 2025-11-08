"use client";

import ProtectedRoute from "@/app/components/ProtectedRoute";
import { useEffect, useState } from "react";
import { apiRequest } from "@/helpers/apiRequest";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import UserGameList from "@/app/components/UserGameList";

interface Game {
  _id: string;
  title: string;
  thumbnailUrl?: string;
}

interface Review {
  _id: string;
  game: { _id: string };
  title: string;
  reviewBody: string;
  rating: number;
}

interface UserGame {
  _id: string;
  status: string;
  notes?: string;
  updatedAt: string;
  game: Game;
}

interface UserGameResponse {
  userGames: UserGame[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ReviewsResponse {
  reviews: Review[];
}

export const UserGamePage = ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { user } = useAuth();
  const [userId, setUserId] = useState("");
  const [userGames, setUserGames] = useState<UserGame[]>([]);
  const [reviewsMap, setReviewsMap] = useState<Map<string, Review>>(new Map());
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Resolve params
  useEffect(() => {
    (async () => {
      const { id } = await params;
      setUserId(id);
    })();
  }, [params]);

  // Fetch games and reviews
  useEffect(() => {
    if (!userId) return;

    const fetchUserGamesAndReviews = async () => {
      setLoading(true);
      try {
        const [gamesData, reviewsData] = await Promise.all([
          apiRequest<UserGameResponse>(
            `/api/users/${userId}/games?page=${page}&limit=10`
          ),
          apiRequest<ReviewsResponse>(`/api/users/${userId}/reviews`),
        ]);

        // Map gameId → review
        const map = new Map<string, Review>();
        for (const review of reviewsData.reviews) {
          if (review.game?._id) map.set(review.game._id, review);
        }

        setUserGames(gamesData.userGames);
        setReviewsMap(map);
        setTotalPages(gamesData.totalPages);
      } catch (err: any) {
        toast.error(err.message || "Failed to load library.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserGamesAndReviews();
  }, [userId, page]);

  return (
    <ProtectedRoute>
      <div className="max-w-5xl mx-auto py-10 px-4 text-foreground">
        <h1 className="font-display text-3xl text-boulder-gold font-bold mb-8 text-center">
          {user?.id === userId ? "My Library" : "User Library"}
        </h1>
        <UserGameList
          userId={userId}
          userGames={userGames}
          reviewsMap={reviewsMap}
          loading={loading}
        />
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-10 gap-3">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-md bg-boulder-mid/70 border border-boulder-gold/30 text-gray-300 hover:border-boulder-gold/60 hover:text-boulder-gold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Prev
            </button>

            <span className="text-gray-400 text-sm flex items-center">
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-md bg-boulder-mid/70 border border-boulder-gold/30 text-gray-300 hover:border-boulder-gold/60 hover:text-boulder-gold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

export default UserGamePage;