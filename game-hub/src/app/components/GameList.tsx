import { motion, AnimatePresence } from "framer-motion";
import GameCard from "./GameCard";

interface Game {
  _id: string;
  title: string;
  thumbnailUrl?: string;
  genres: string[];
  platforms: string[];
}

interface GameListProps {
  games: Game[];
  loading: boolean;
  clearFilters: () => void;
}

export const GameList = ({ games, loading, clearFilters }: GameListProps) => {
  // Skeleton shimmer while loading
  if (loading && !games.length) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="bg-boulder-mid/40 rounded-xl overflow-hidden border border-boulder-gold/10 relative"
          >
            <div className="aspect-video bg-boulder-mid relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-boulder-gold/10 to-transparent animate-[shimmer_2s_infinite]" />
            </div>
            <div className="p-4 space-y-3">
              <div className="h-4 w-3/4 bg-boulder-mid/60 rounded"></div>
              <div className="h-3 w-1/2 bg-boulder-mid/60 rounded"></div>
              <div className="h-2 w-1/3 bg-boulder-mid/60 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (!games.length) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12 space-y-3">
        <p className="text-lg text-gray-400">No games found matching your filters.</p>
        <button
          onClick={clearFilters}
          className="px-4 py-2 bg-boulder-gold text-boulder-dark font-semibold rounded-lg hover:bg-boulder-accent transition"
        >
          Clear Filters
        </button>
      </div>
    );
  }

  // Cards
  return (
    <AnimatePresence>
      <motion.div
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {games.map((game) => (
          <motion.div
            key={game._id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <GameCard game={game} />
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}

export default GameList;