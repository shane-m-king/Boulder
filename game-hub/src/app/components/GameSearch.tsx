import { Loader2 } from "lucide-react";

interface GameSearchProps {
  search: string;
  setSearch: (val: string) => void;
  genre: string;
  setGenre: (val: string) => void;
  platform: string;
  setPlatform: (val: string) => void;
  clearFilters: () => void;
  isSearching: boolean;
}

export const GameSearch = ({
  search,
  setSearch,
  genre,
  setGenre,
  platform,
  setPlatform,
  clearFilters,
  isSearching,
}: GameSearchProps) => {
  const genres = [
    "Action", "Adventure", "RPG", "Strategy", "Simulation", "Sports", "Horror", "Puzzle",
  ];
  const platforms = [
    "PC", "PlayStation", "Xbox", "Switch", "Mobile", "Mac", "Linux",
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
      {/* Search */}
      <div className="flex-1 relative">
        <label htmlFor="search" className="block text-sm font-semibold text-gray-300 mb-1 uppercase tracking-wider">
          Search
        </label>
        <input
          id="search"
          type="text"
          placeholder="Search games..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 bg-boulder-mid/70 border border-boulder-gold/30 rounded-lg text-foreground focus:ring-2 focus:ring-boulder-gold pr-10"
        />
        {isSearching && <Loader2 className="absolute right-3 bottom-2.5 h-4 w-4 text-boulder-gold animate-spin" />}
      </div>

      {/* Genre */}
      <div className="sm:w-48">
        <label htmlFor="genre" className="block text-sm font-semibold text-gray-300 mb-1 uppercase tracking-wider">
          Genre
        </label>
        <select
          id="genre"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="w-full px-3 py-2 bg-boulder-mid/70 border border-boulder-gold/30 rounded-lg text-foreground focus:ring-2 focus:ring-boulder-gold"
        >
          <option value="">All</option>
          {genres.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {/* Platform */}
      <div className="sm:w-48">
        <label htmlFor="platform" className="block text-sm font-semibold text-gray-300 mb-1 uppercase tracking-wider">
          Platform
        </label>
        <select
          id="platform"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="w-full px-3 py-2 bg-boulder-mid/70 border border-boulder-gold/30 rounded-lg text-foreground focus:ring-2 focus:ring-boulder-gold"
        >
          <option value="">All</option>
          {platforms.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {(genre || platform || search) && (
        <div className="text-right w-full sm:w-auto">
          <button
            onClick={clearFilters}
            className="text-sm text-gray-400 hover:text-boulder-accent underline transition"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
 export default GameSearch;