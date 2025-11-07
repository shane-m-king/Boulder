"use client";

import Link from "next/link";

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
  title: string;
  reviewBody: string;
  rating: number;
}

interface UserGameCardProps {
  userId: string;
  userGame: UserGame;
  review: Review | null;
}

export default function UserGameCard({ userId, userGame, review }: UserGameCardProps) {
  const { game, status, notes, updatedAt } = userGame;

  const statusStyleMap: Record<string, string> = {
    Owned: "bg-boulder-gold text-boulder-dark",
    Wishlisted: "bg-boulder-accent text-boulder-dark",
    "Not Owned": "bg-boulder-mid/70 text-gray-300 border border-boulder-gold/30",
  };

  return (
    <div className="flex flex-col md:flex-row bg-boulder-mid/40 border border-boulder-gold/20 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all">
      {/* Thumbnail */}
      <div className="md:w-1/4 w-full aspect-video md:aspect-auto">
        {game.thumbnailUrl ? (
          <img
            src={game.thumbnailUrl}
            alt={game.title}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm bg-boulder-dark/50">
            No Image
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 flex flex-col justify-between p-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display text-xl font-semibold text-boulder-gold">
              {game.title}
            </h2>
            <span
              className={`text-xs font-semibold px-2 py-1 rounded-md ${statusStyleMap[status]}`}
            >
              {status}
            </span>
          </div>
      
          <p className="text-sm text-gray-400 mb-3">
            Updated: {new Date(updatedAt).toLocaleDateString()}
          </p>
      
          {/* Notes */}
          {notes && (
            <div className="bg-boulder-mid/30 border border-boulder-gold/30 rounded-lg p-3 mb-4">
              <strong className="block text-boulder-accent mb-1">Notes</strong>
              <p className="text-sm text-gray-300">
                {notes.length > 250
                  ? notes.slice(0, 250) + "..."
                  : notes || "No notes."}
              </p>
            </div>
          )}
      
          {/* Review */}
          <div className="bg-boulder-mid/30 border border-boulder-gold/30 rounded-lg p-3">
            <strong className="block text-boulder-accent mb-1">Review</strong>
            {review ? (
              <div className="space-y-1">
                <p className="text-sm text-boulder-gold font-semibold">
                  {review.title}{" "}
                  <span className="text-gray-400 text-xs">({review.rating}/10)</span>
                </p>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {review.reviewBody.length > 300
                    ? review.reviewBody.slice(0, 300) + "..."
                    : review.reviewBody}
                </p>
              </div>
            ) : (
              <p className="text-gray-500 italic text-sm">No review yet.</p>
            )}
          </div>
        </div>
      
        {/* Footer */}
        <div className="mt-4 text-right">
          <Link
            href={`/profile/${userId}/games/${game._id}`}
            className="text-boulder-gold text-sm font-medium hover:underline"
          >
            View Details →
          </Link>
        </div>
      </div>
    </div>
  );
}
