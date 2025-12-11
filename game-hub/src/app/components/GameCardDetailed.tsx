"use client";
import { useEffect, useState } from "react";
import { apiRequest } from "@/helpers/apiRequest";
import { useAuth } from "@/contexts/AuthContext";
import { toastAction } from "@/helpers/toastAction";
import { STATUSES } from "@/constants/statuses";
import toast from "react-hot-toast";

interface Game {
  _id: string;
  title: string;
  summary?: string;
  genres: string[];
  platforms: string[];
  thumbnailUrl?: string;
  releaseDate: string;
}

interface Review {
  _id: string;
  title: string;
  rating: number;
  reviewBody: string;
  user: { username: string };
}

export const GameCardDetailed = ({ gameId }: { gameId?: string }) => {
  const { user } = useAuth();
  const [game, setGame] = useState<Game | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [inLibrary, setInLibrary] = useState<boolean | null>(null);
  const [status, setStatus] = useState<string>("Unowned");

  useEffect(() => {
  if (!gameId) return;

  const fetchGameAndReviews = async () => {
    setLoading(true);
    try {
      const [{ game }, { reviews }] = await Promise.all([
        apiRequest<{ game: Game }>(`/api/games/${gameId}`),
        apiRequest<{ reviews: Review[] }>(`/api/games/${gameId}/reviews`),
      ]);
      setGame(game);
      setReviews(reviews);

      // If logged in, check if game is in user library and get status
      if (user) {
        try {
          const data = await apiRequest<{ userGame?: { status: string } }>(
            `/api/users/${user.id}/games/${gameId}`,
            { method: "GET" }
          );

          if (data.userGame) {
            setInLibrary(true);
            setStatus(data.userGame.status || "Not Owned");
          } else {
            setInLibrary(false);
            setStatus("Not Owned");
          }
        } catch {
          setInLibrary(false);
          setStatus("Not Owned");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load game data.");
    } finally {
      setLoading(false);
    }
  };

  fetchGameAndReviews();
}, [gameId, user]);


  // Handlers
  const handleAdd = async () => {
    if (!user || !game) return;
    setInLibrary(true);

    await toastAction(
      apiRequest(`/api/users/${user.id}/games`, {
        method: "POST",
        body: JSON.stringify({ game: game._id, status: "Not Owned", notes: "" }),
      }),
      {
        loading: "Adding to your library...",
        success: "Added to your library!",
        error: (err: any) => {
          setInLibrary(false);
          return err.message || "Failed to add game.";
        },
      }
    );
  };

  const handleRemove = async () => {
    if (!user || !game) return;
    setInLibrary(false);
    await toastAction(
      apiRequest(`/api/users/${user.id}/games/${game._id}`, {
        method: "DELETE",
      }),
      {
        loading: "Removing from your library...",
        success: "Removed from your library!",
        error: (err) => {
          setInLibrary(true);
          return err.message || "Failed to remove game.";
        },
      }
    );
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!user || !game) return;
    setStatus(newStatus);

    await toastAction(
      apiRequest(`/api/users/${user.id}/games/${game._id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      }),
      {
        loading: "Updating status...",
        success: `Status set to "${newStatus}"`,
        error: (err) => err.message || "Failed to update status.",
      }
    );
  };

  if (loading || !gameId)
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center text-gray-400 animate-pulse">
        <div className="h-64 bg-boulder-mid/40 rounded-xl mb-8"></div>
        <div className="space-y-3">
          <div className="h-6 bg-boulder-mid/50 rounded w-1/2 mx-auto"></div>
          <div className="h-4 bg-boulder-mid/40 rounded w-3/4 mx-auto"></div>
          <div className="h-4 bg-boulder-mid/40 rounded w-2/3 mx-auto"></div>
        </div>
      </div>
    );

  if (!game)
    return (
      <p className="text-center text-red-400 mt-10">
        Could not find game details.
      </p>
    );

  return (
    <div className="max-w-5xl mx-auto text-foreground py-10 px-4">
      {/* Game Info */}
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
          <h1 className="font-display text-4xl font-bold text-boulder-gold mb-2">
            {game.title}
          </h1>
          <p className="text-gray-400 mb-4">
            Released:{" "}
            {game.releaseDate
              ? new Date(game.releaseDate).toLocaleDateString()
              : "Unknown"}
          </p>

          {game.summary ? (
            <p className="mb-6 text-gray-300 leading-relaxed">{game.summary}</p>
          ) : (
            <p className="mb-6 italic text-gray-500">No summary provided.</p>
          )}

          <div className="space-y-1 text-sm">
            <p>
              <strong className="text-boulder-accent">Genres:</strong>{" "}
              {game.genres?.length > 0 ? game.genres.join(", ") : "N/A"}
            </p>
            <p>
              <strong className="text-boulder-accent">Platforms:</strong>{" "}
              {game.platforms?.length > 0 ? game.platforms.join(", ") : "N/A"}
            </p>
          </div>

          {user && (
            <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-4">
              {/* If not in library → Add button */}
              {!inLibrary && (
                <button
                  onClick={handleAdd}
                  className="bg-boulder-gold text-boulder-dark font-semibold px-4 py-2 rounded-md hover:bg-boulder-accent hover:shadow-lg transition-all cursor-pointer"
                >
                  Add to Library
                </button>
              )}
          
              {/* If in library → Remove button + Status dropdown */}
              {inLibrary && (
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    onClick={handleRemove}
                    className="bg-red-500/80 hover:bg-red-500 text-white font-semibold px-4 py-2 rounded-md transition-all cursor-pointer"
                  >
                    Remove from Library
                  </button>
          
                  {/* Status Selector */}
                  <div className="flex items-center gap-2">
                    <select
                      id="status"
                      value={status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="bg-boulder-mid/60 border border-boulder-gold/40 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-boulder-gold cursor-pointer"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-boulder-gold/20 mt-10 mb-8"></div>

      {/* Reviews */}
      <div>
        <h2 className="font-display text-2xl mb-4 text-boulder-accent">
          Reviews
        </h2>
        {reviews.length > 0 ? (
          <ul className="space-y-4">
            {reviews.map((r) => (
              <li
                key={r._id}
                className="bg-boulder-mid/50 p-4 rounded-lg border border-boulder-gold/20 hover:border-boulder-gold/40 transition-all"
              >
                <div className="flex justify-between items-center mb-2">
                  <p className="font-semibold text-boulder-gold">
                    {r.user.username}
                  </p>
                  <p className="text-sm text-gray-400">⭐ {r.rating}/10</p>
                </div>
                <h3 className="font-display text-lg mb-1">{r.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {r.reviewBody}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400 italic">
            No reviews yet. Be the first to review this game!
          </p>
        )}
      </div>
    </div>
  );
}

export default GameCardDetailed;
