import Link from "next/link";

interface GameCardProps {
  game: {
    _id: string;
    title: string;
    thumbnailUrl?: string;
    genres: string[];
    platforms: string[];
  };
}

export const GameCard = ({ game }: GameCardProps) => {
  return (
    <Link
      href={`/games/${game._id}`}
      className="group block bg-boulder-mid/80 rounded-xl overflow-hidden border border-boulder-gold/20 hover:border-boulder-gold/60 hover:shadow-lg transition-all duration-300 h-full"
    >
      {/* Thumbnail Wrapper */}
      <div className="relative aspect-video overflow-hidden bg-boulder-mid">
        {/* Image */}
        {game.thumbnailUrl ? (
          <img
            src={game.thumbnailUrl}
            alt={game.title}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            No Image
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-boulder-gold/25 via-transparent to-transparent" />

        {/* Border glow on hover */}
        <div className="absolute inset-0 border border-transparent group-hover:border-boulder-gold/40 rounded-xl transition-all duration-300 pointer-events-none" />
      </div>

      {/* Card Content */}
      <div className="p-4 flex flex-col justify-between h-[8.5rem]">
        <div>
          <h3
            className="font-display text-lg font-semibold text-boulder-gold leading-tight mb-1 line-clamp-2 group-hover:text-boulder-accent group-hover:drop-shadow-[0_0_6px_rgba(250,204,21,0.3)] transition-all duration-300"
            title={game.title}
          >
            {game.title}
          </h3>
          <p className="text-sm text-gray-400 mb-1 truncate">
            {game.genres.slice(0, 2).join(", ") || "Unknown Genre"}
          </p>
        </div>
        <p className="text-xs text-gray-500 truncate">
          {game.platforms.slice(0, 2).join(", ") || "Unknown Platform"}
        </p>
      </div>
    </Link>
  );
}

export default GameCard;
