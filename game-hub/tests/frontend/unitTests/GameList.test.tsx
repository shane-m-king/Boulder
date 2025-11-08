import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import GameList from "@/app/components/GameList";

const mockGames = [
  {
    _id: "1",
    title: "Hades",
    genres: ["Roguelike", "Action"],
    platforms: ["PC", "Switch"],
  },
  {
    _id: "2",
    title: "Stardew Valley",
    genres: ["Simulation", "RPG"],
    platforms: ["PC"],
  },
];

// Mock GameCard component
jest.mock("@/app/components/GameCard", () => ({
  __esModule: true,
  default: ({ game }: any) => <div data-testid="mock-card">{game.title}</div>,
}));

describe("GameList Component", () => {
  it("renders skeleton shimmer when loading and no games", () => {
    render(<GameList games={[]} loading={true} clearFilters={jest.fn()} />);

    // Expect multiple placeholder skeletons
    const skeletons = screen.getAllByRole("generic");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders game cards when games are available", () => {
    render(<GameList games={mockGames} loading={false} clearFilters={jest.fn()} />);

    expect(screen.getByText("Hades")).toBeInTheDocument();
    expect(screen.getByText("Stardew Valley")).toBeInTheDocument();

    // The mocked GameCard should render twice
    const cards = screen.getAllByTestId("mock-card");
    expect(cards.length).toBe(2);
  });

  it("renders empty state message when no games are found", () => {
    render(<GameList games={[]} loading={false} clearFilters={jest.fn()} />);
    expect(screen.getByText(/No games found/i)).toBeInTheDocument();
  });

  it("calls clearFilters when 'Clear Filters' button is clicked", () => {
    const mockClearFilters = jest.fn();
    render(<GameList games={[]} loading={false} clearFilters={mockClearFilters} />);

    const clearButton = screen.getByRole("button", { name: /Clear Filters/i });
    fireEvent.click(clearButton);
    expect(mockClearFilters).toHaveBeenCalledTimes(1);
  });
});
