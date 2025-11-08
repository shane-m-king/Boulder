"use client";

import { motion, AnimatePresence } from "framer-motion";
import UserGameCard from "./UserGameCard";

interface Game {
  _id: string;
  title: string;
  thumbnailUrl?: string;
}

interface Review {
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

interface UserGamesListProps {
  userId: string;
  userGames: UserGame[];
  reviewsMap: Map<string, Review>;
  loading: boolean;
  clearFilters?: () => void;
}

export const UserGameList = ({
  userId,
  userGames,
  reviewsMap,
  loading,
}: UserGamesListProps) => {
  // Loading skeleton
  if (loading && !userGames.length) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col md:flex-row bg-boulder-mid/40 border border-boulder-gold/20 rounded-xl overflow-hidden shadow-sm"
          >
            <div className="md:w-1/4 w-full aspect-video bg-boulder-mid relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-boulder-gold/10 to-transparent animate-[shimmer_2s_infinite]" />
            </div>
            <div className="flex-1 p-5 space-y-3">
              <div className="h-4 w-2/3 bg-boulder-mid/60 rounded"></div>
              <div className="h-3 w-1/2 bg-boulder-mid/60 rounded"></div>
              <div className="h-3 w-3/4 bg-boulder-mid/60 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (!userGames.length) {
    return (
      <div className="text-center py-10 text-gray-400 italic">
        No games found in this user’s library.
      </div>
    );
  }

  // Animated list
  return (
    <AnimatePresence>
      <motion.div
        layout
        className="flex flex-col gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {userGames.map((userGame) => (
          <motion.div
            key={userGame._id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <UserGameCard
              userId={userId}
              userGame={userGame}
              review={reviewsMap.get(userGame.game._id) || null}
            />
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
};

export default UserGameList;
