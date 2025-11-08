import { render, screen } from "@testing-library/react";
import GameCard from "@/app/components/GameCard";
import "@testing-library/jest-dom";

const mockGame = {
  _id: "123",
  title: "Celeste",
  thumbnailUrl: "celeste.jpg",
  genres: ["Platformer", "Indie"],
  platforms: ["PC", "Switch"],
};

describe("GameCard Component", () => {
  it("renders the game title", () => {
    render(<GameCard game={mockGame} />);
    expect(screen.getByText("Celeste")).toBeInTheDocument();
  });

  it("renders game genres and platforms", () => {
    render(<GameCard game={mockGame} />);
    expect(screen.getByText(/Platformer/)).toBeInTheDocument();
    expect(screen.getByText(/PC/)).toBeInTheDocument();
  });

  it("displays thumbnail image when provided", () => {
    render(<GameCard game={mockGame} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "celeste.jpg");
    expect(img).toHaveAttribute("alt", "Celeste");
  });

  it("shows 'No Image' when thumbnail is missing", () => {
    render(<GameCard game={{ ...mockGame, thumbnailUrl: undefined }} />);
    expect(screen.getByText(/No Image/i)).toBeInTheDocument();
  });

  it("links to correct game detail page", () => {
    render(<GameCard game={mockGame} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", `/games/${mockGame._id}`);
  });
});
