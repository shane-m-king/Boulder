"use client";
import { useEffect, useState, useRef } from "react";
import { apiRequest } from "@/helpers/apiRequest";
import toast from "react-hot-toast";
import GameSearch from "../components/GameSearch";
import GameList from "../components/GameList";
import GamePages from "../components/GamePages";

interface Game {
  _id: string;
  title: string;
  genres: string[];
  platforms: string[];
  thumbnailUrl?: string;
}

interface GamesResponse {
  games: Game[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const GamesPage = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [genre, setGenre] = useState("");
  const [platform, setPlatform] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 9;

  // Debounce search to reduce fetch frequency
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch games whenever filters or page change
  useEffect(() => {
    const fetchGames = async () => {
      setIsSearching(true);
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (genre) params.set("genre", genre);
        if (platform) params.set("platform", platform);

        const data = await apiRequest<GamesResponse>(`/api/games?${params}`);
        setGames(data.games);
        setTotalPages(data.totalPages);
      } catch (err: any) {
        toast.error(err.message || "Failed to fetch games");
      } finally {
        setLoading(false);
        setIsSearching(false);
      }
    };

    fetchGames();
  }, [debouncedSearch, genre, platform, page]);

  const clearFilters = () => {
    setSearch("");
    setGenre("");
    setPlatform("");
    setPage(1);
  };

  return (
    <section className="min-h-[calc(100vh-4.1rem)] bg-boulder-dark text-foreground">
      <div className="container mx-auto py-8 px-4">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-boulder-gold mb-6">
          Browse Games
        </h1>

        <GameSearch
          search={search}
          setSearch={(val) => {
            setSearch(val);
            setPage(1);
          }}
          genre={genre}
          setGenre={(val) => {
            setGenre(val);
            setPage(1);
          }}
          platform={platform}
          setPlatform={(val) => {
            setPlatform(val);
            setPage(1);
          }}
          clearFilters={clearFilters}
          isSearching={isSearching}
        />

        <GameList games={games} loading={loading} clearFilters={clearFilters} />

        <GamePages page={page} totalPages={totalPages} setPage={setPage} />
      </div>
    </section>
  );
}

export default GamesPage;
