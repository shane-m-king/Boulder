"use client";
import { useState, useEffect } from "react";
import { apiRequest } from "@/helpers/apiRequest";
import { toastAction } from "@/helpers/toastAction";
import { useAuth } from "@/contexts/AuthContext";

interface ReviewModalProps {
  gameId: string;
  reviewId?: string | null;
  onClose: () => void;
  onSuccess?: () => void;
  existingReview?: {
    title: string;
    body: string;
    rating: number;
  } | null;
}


export const ReviewModal = ({ gameId, reviewId, onClose, onSuccess, existingReview }: ReviewModalProps) => {
  const { user } = useAuth();

  const [title, setTitle] = useState(existingReview?.title || "");
  const [rating, setRating] = useState<number | "">(existingReview?.rating || "");
  const [reviewBody, setReviewBody] = useState(existingReview?.body || "");
  const isEditMode = Boolean(existingReview);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sets review data if data arrives late
  useEffect(() => {
  if (existingReview) {
    setTitle(existingReview.title);
    setReviewBody(existingReview.body);
    setRating(existingReview.rating);
  }
}, [existingReview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!title.trim() || !reviewBody.trim() || !rating || rating < 0 || rating > 10) {
      setErrorMessage("Please fill out all fields and provide a valid rating (0-10).");
      return;
    }

    setIsSubmitting(true);

    try {
      await toastAction(
        apiRequest(isEditMode ? `/api/reviews/${reviewId}` : `/api/reviews`, {
          method: isEditMode ? "PATCH" : "POST",
          body: isEditMode ? JSON.stringify({
            user: user?.id,
            title: title.trim(),
            reviewBody: reviewBody.trim(),
            rating,
          }) : JSON.stringify({
            user: user?.id,
            game: gameId,
            title: title.trim(),
            reviewBody: reviewBody.trim(),
            rating,
          }),
        }),
        {
          loading: isEditMode ? "Updating your review..." : "Submitting your review...",
          success: isEditMode ? "Review updated!" : "Review submitted!",
          error: (err) => err.message || "Failed to save review.",
        }
      );

      // Close modal only if submission succeeds
      setTitle("");
      setRating("");
      setReviewBody("");
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Error submitting review:", err);
      setErrorMessage(err.message || "Something went wrong while submitting.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-center items-center">
      <div className="bg-boulder-dark border border-boulder-gold/30 rounded-xl p-6 w-full max-w-md shadow-lg relative">
        <h2 className="font-display text-2xl text-boulder-gold mb-4 text-center">
          {isEditMode ? "Edit Your Review" : "Write a Review"}
        </h2>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="review-title" className="block text-sm text-gray-300 mb-1">Title</label>
            <input
              type="text"
              id="review-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-boulder-mid/60 border border-boulder-gold/40 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-boulder-gold"
              placeholder="Enter review title..."
            />
          </div>

          <div>
            <label htmlFor="review-rating" className="block text-sm text-gray-300 mb-1">Rating (0-10)</label>
            <input
              type="number"
              id="review-rating"
              min="0"
              max="10"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="w-full bg-boulder-mid/60 border border-boulder-gold/40 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-boulder-gold"
            />
          </div>

          <div>
            <label htmlFor="review-body" className="block text-sm text-gray-300 mb-1">Review</label>
            <textarea
              id="review-body"
              value={reviewBody}
              onChange={(e) => setReviewBody(e.target.value)}
              rows={4}
              className="w-full bg-boulder-mid/60 border border-boulder-gold/40 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-boulder-gold resize-none"
              placeholder="Write your thoughts about this game..."
            />
          </div>

          {/* Inline error feedback */}
          {errorMessage && (
            <p className="text-red-400 text-sm text-center">{errorMessage}</p>
          )}

          <div className="flex justify-between items-center mt-6">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-600 text-gray-200 px-4 py-2 rounded-md hover:bg-gray-500 transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 rounded-md font-semibold cursor-pointer ${
                isSubmitting
                  ? "bg-boulder-gold/50 cursor-not-allowed"
                  : "bg-boulder-gold text-boulder-dark hover:bg-boulder-accent"
              }`}
            >
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReviewModal;