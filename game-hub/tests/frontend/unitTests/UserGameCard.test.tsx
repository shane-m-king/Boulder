import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import UserGameCard from "@/app/components/UserGameCard";

describe("UserGameCard Component", () => {
  const baseUserGame = {
    _id: "1",
    status: "Owned",
    notes: "Great game!",
    updatedAt: new Date("2025-10-01").toISOString(),
    game: {
      _id: "game123",
      title: "Hades",
      thumbnailUrl: "https://example.com/hades.jpg",
    },
  };

  const baseReview = {
    title: "Awesome roguelike",
    reviewBody: "Fast, fluid combat and great characters.",
    rating: 9,
  };

  it("renders game title and status badge", () => {
    render(
      <UserGameCard userId="user123" userGame={baseUserGame} review={baseReview} />
    );

    expect(screen.getByText("Hades")).toBeInTheDocument();
    expect(screen.getByText("Owned")).toBeInTheDocument();
  });

  it("renders notes and review sections when provided", () => {
    render(
      <UserGameCard userId="user123" userGame={baseUserGame} review={baseReview} />
    );

    expect(screen.getByText(/Notes/i)).toBeInTheDocument();
    expect(screen.getByText(/Review/i)).toBeInTheDocument();
    expect(screen.getByText("Great game!")).toBeInTheDocument();
    expect(screen.getByText("Awesome roguelike")).toBeInTheDocument();
  });

  it("shows 'No Image' placeholder when thumbnail is missing", () => {
    const noThumbUserGame = {
      ...baseUserGame,
      game: { ...baseUserGame.game, thumbnailUrl: undefined },
    };

    render(
      <UserGameCard userId="user123" userGame={noThumbUserGame} review={null} />
    );

    expect(screen.getByText(/No Image/i)).toBeInTheDocument();
  });

  it("renders a link to the correct game detail page", () => {
    render(
      <UserGameCard userId="user123" userGame={baseUserGame} review={baseReview} />
    );

    const link = screen.getByRole("link", { name: /View Details/i });
    expect(link).toHaveAttribute("href", "/profile/user123/games/game123");
  });

  it("shows 'No review yet' when review is null", () => {
    render(
      <UserGameCard userId="user123" userGame={baseUserGame} review={null} />
    );

    expect(screen.getByText(/No review yet/i)).toBeInTheDocument();
  });

  it("shows truncated notes and review body when too long", () => {
    const longNote = "A".repeat(300);
    const longReview = { ...baseReview, reviewBody: "B".repeat(400) };
    const userGame = { ...baseUserGame, notes: longNote };

    render(
      <UserGameCard userId="user123" userGame={userGame} review={longReview} />
    );

    expect(screen.getByText(/A{250}\.\.\./)).toBeInTheDocument();
    expect(screen.getByText(/B{300}\.\.\./)).toBeInTheDocument();
  });
});
