"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/helpers/apiRequest";
import { useAuth } from "@/contexts/AuthContext";
import { toastAction } from "@/helpers/toastAction";
import { STATUSES } from "@/constants/statuses";
import ReviewModal from "@/app/components/ReviewModal";
import toast from "react-hot-toast";
import ProtectedRoute from "@/app/components/ProtectedRoute";

interface Game {
  _id: string;
  title: string;
  genres: string[];
  platforms: string[];
  thumbnailUrl?: string;
  releaseDate?: string;
}

interface UserGame {
  _id: string;
  status: string;
  notes: string;
  updatedAt: string;
  game: Game;
}

interface Review {
  _id: string;
  title: string;
  game: string;
  reviewBody: string;
  rating: number;
  updatedAt: Date;
}

interface ReviewsResponse {
  reviews: Review[];
  total: number;
  page?: number;
  pages?: number;
  limit?: number;
}

export const UserGameDetailPage = ({
  params,
}: {
  params: Promise<{ id: string; gameId: string }>;
}) => {
  const { user } = useAuth();
  const [userId, setUserId] = useState<string>("");
  const [gameId, setGameId] = useState<string>("");
  const [userGame, setUserGame] = useState<UserGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewBody, setReviewBody] = useState("");
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [reviewUpdatedAt, setReviewUpdatedAt] = useState<Date | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [existingReview, setExistingReview] = useState<boolean>(false);
  const [animateReview, setAnimateReview] = useState(false);


  useEffect(() => {
    (async () => {
      const { id, gameId } = await params;
      setUserId(id);
      setGameId(gameId);
    })();
  }, [params]);

  useEffect(() => {
    if (!userId || !gameId || !user?.id) return;
    const fetchUserGame = async () => {  
      setLoading(true);  
      try {
        const data = await apiRequest<{ userGame: UserGame }>(  
          `/api/users/${userId}/games/${gameId}`,  
          { method: "GET" }  
        );
        setUserGame(data.userGame);
        setStatus(data.userGame.status);
        setNotes(data.userGame.notes || "");
        setIsOwner(user?.id === userId);
      } catch (err: any) {
        toast.error(err.message || "Failed to load user game.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchExistingReview();
    fetchUserGame();
}, [userId, gameId, user]);


  const handleSaveChanges = async () => {
    if (!userGame) return;
    await toastAction(
      apiRequest(`/api/users/${userId}/games/${gameId}`, {
        method: "PATCH",
        body: JSON.stringify({ status, notes }),
      }),
      {
        loading: "Saving changes...",
        success: "Library entry updated!",
        error: (err) => err.message || "Failed to save changes.",
      }
    );
  };

  const fetchExistingReview = async () => {
  try {
    const data = await apiRequest<ReviewsResponse>(
      `/api/users/${userId}/reviews`,
      { method: "GET" }
    );

    // find the review that matches this specific game
    const review = data.reviews.find((r) => r.game === gameId);
    if (review) {
      setExistingReview(true);
      setReviewTitle(review.title);
      setReviewBody(review.reviewBody);
      setRating(review.rating);
      setReviewUpdatedAt(review.updatedAt || null);
      setReviewId(review._id);

      // Animation on updated review
      setAnimateReview(true);
      setTimeout(() => setAnimateReview(false), 600);
    } else {
      setExistingReview(false);
      setReviewTitle("");
      setReviewBody("");
      setRating(0);
      setReviewUpdatedAt(null);
      setReviewId(null);
    }
  } catch (err) {
    console.error("Failed to fetch review:", err);
    setExistingReview(false);
  }
};


  const handleOpenReviewModal = async () => {
    await fetchExistingReview();
    setShowReviewModal(true);
};

  if (loading || !user)
    return (
      <ProtectedRoute>
        <p className="text-center text-boulder-gold mt-10 animate-pulse">
          Loading game details...
        </p>
      </ProtectedRoute>  
    );

  if (!userGame)
    return (
      <ProtectedRoute>
        <p className="text-center text-red-400 mt-10">
          Game not found.
        </p>
      </ProtectedRoute>
    );

  const { game } = userGame;

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto text-foreground py-10 px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-8">
          {game.thumbnailUrl ? (
            <img
              src={game.thumbnailUrl}
              alt={game.title}
              className="rounded-xl shadow-lg w-full md:w-1/3 object-cover border border-boulder-gold/30"
            />
          ) : (
            <div className="flex items-center justify-center w-full md:w-1/3 h-64 bg-boulder-mid/60 rounded-xl text-gray-500 text-sm">
              No image available
            </div>
          )}
  
          <div className="flex-1">
            <h1 className="font-display text-3xl font-bold text-boulder-gold mb-2">
              {game.title}
            </h1>
            <p className="text-sm text-gray-400 mb-2">
              Updated: {new Date(userGame.updatedAt).toLocaleDateString()}
            </p>
  
            {isOwner ? (
              <div className="space-y-4">
                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="bg-boulder-mid/60 border border-boulder-gold/40 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-boulder-gold"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
  
                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Write your personal notes about this game..."
                    className="w-full h-32 bg-boulder-mid/60 border border-boulder-gold/40 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-boulder-gold resize-none"
                  />
                </div>
  
                {isOwner && (<div className="flex justify-between items-center mt-6">
                  <button
                    onClick={handleSaveChanges}
                    className="bg-boulder-gold text-boulder-dark font-semibold px-4 py-2 rounded-md hover:bg-boulder-accent hover:shadow-lg transition-all cursor-pointer"
                  >
                    Save Changes
                  </button>
                
                  <button
                    onClick={handleOpenReviewModal}
                    className="bg-boulder-mid/70 border border-boulder-gold/40 text-boulder-gold font-semibold px-4 py-2 rounded-md hover:bg-boulder-accent hover:text-boulder-dark hover:shadow-lg transition-all cursor-pointer"
                  >
                    Review
                  </button>
                </div>)}
              </div>
            ) : (
              <div className="space-y-4">
                <p>
                  <strong className="text-boulder-accent">Status:</strong>{" "}
                  {userGame.status}
                </p>
                <p>
                  <strong className="text-boulder-accent">Notes:</strong>{" "}
                  {userGame.notes ? (
                    <span className="text-gray-300">{userGame.notes}</span>
                  ) : (
                    <span className="italic text-gray-500">
                      No notes provided.
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
  
        {/* Divider */}
        <div className="border-t border-boulder-gold/20 mt-10 mb-8"></div>
  
        {/* Review Section */}
        <div>
          <h2 className="font-display text-2xl mb-4 text-boulder-accent">Review</h2>
  
          {existingReview ? (
            <div
              className={`bg-boulder-mid/50 border border-boulder-gold/30 rounded-xl p-4 shadow-sm transition-all duration-500 ${
                animateReview ? "animate-goldPulse border-boulder-gold/70 shadow-lg" : ""
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-display text-xl text-boulder-gold">{reviewTitle}</h3>
                <span className="text-sm text-boulder-accent font-semibold">
                  ⭐ {rating}/10
                </span>
              </div>
          
              <p className="text-gray-300 whitespace-pre-line mb-3">{reviewBody}</p>
          
              {reviewUpdatedAt && (
                <p className="text-xs text-gray-500 text-right italic">
                  Last updated: {new Date(reviewUpdatedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-400 italic">
              {isOwner
                ? "You haven't reviewed this game yet!"
                : "This user hasn't reviewed this game yet."}
            </p>
          )}
  
        </div>
        {/* Review Modal */}
        {showReviewModal && (
          <ReviewModal
            gameId={game._id}
            reviewId={reviewId}
            onClose={() => setShowReviewModal(false)}
            onSuccess={async () => {
              await fetchExistingReview();
            }}
            existingReview={
              existingReview
                ? { title: reviewTitle, body: reviewBody, rating }
                : null
            }
          />
        )}
        {/* Back Button */}
          <div className="mt-10">
            <a
              href={`/profile/${userId}/games`}
              className="inline-flex items-center gap-2 text-sm font-medium text-boulder-gold hover:text-boulder-accent transition-all"
            >
              ← {isOwner ? "Back to My Games" : "Back to User's Games"}
            </a>
          </div>
      </div>
    </ProtectedRoute>
  );
}

export default UserGameDetailPage;