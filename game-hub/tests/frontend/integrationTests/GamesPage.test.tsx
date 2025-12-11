import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { GamesPage } from "@/app/games/page";
import { apiRequest } from "@/helpers/apiRequest";
import toast from "react-hot-toast";

// Mocks
jest.mock("@/helpers/apiRequest");
jest.mock("react-hot-toast", () => ({
  error: jest.fn(),
}));

describe("/games page integration", () => {
  const mockGames = [
    { _id: "1", title: "Elden Ring", genres: ["RPG"], platforms: ["PC"], thumbnailUrl: "", IGDBid: 1 },
    { _id: "2", title: "Celeste", genres: ["Platformer"], platforms: ["Switch"], thumbnailUrl: "", IGDBid: 2 },
  ];

  // Mock scrollIntoView just for this suite
  beforeAll(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders initial loading state and then fetched games", async () => {
    (apiRequest as jest.Mock).mockResolvedValueOnce({
      games: mockGames,
      page: 1,
      totalPages: 1,
      total: 2,
      limit: 9,
    });

    render(<GamesPage />);

    // Loading skeleton
    expect(screen.getByText(/browse games/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledTimes(1);
      expect(screen.getByText("Elden Ring")).toBeInTheDocument();
      expect(screen.getByText("Celeste")).toBeInTheDocument();
    });
  });

  it("handles search input and triggers new fetch", async () => {
    (apiRequest as jest.Mock).mockResolvedValue({
      games: mockGames,
      page: 1,
      totalPages: 1,
      total: 2,
      limit: 9,
    });

    render(<GamesPage />);

    const searchInput = screen.getByPlaceholderText(/search games/i);
    fireEvent.change(searchInput, { target: { value: "Ring" } });

    await waitFor(() => {
      const calls = (apiRequest as jest.Mock).mock.calls.map((call) => call[0]);
      expect(calls.some((url) => url.includes("search=Ring"))).toBe(true);
    });
  });

  it("shows toast error if apiRequest fails", async () => {
    (apiRequest as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

    render(<GamesPage />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Network error");
    });
  });

  it("shows empty state message when no games found", async () => {
    (apiRequest as jest.Mock).mockResolvedValueOnce({
      games: [],
      page: 1,
      totalPages: 1,
      total: 0,
      limit: 9,
    });

    render(<GamesPage />);

    await waitFor(() => {
      expect(screen.getByText(/no games found/i)).toBeInTheDocument();
    });
  });

  it("scrolls to top when page changes", async () => {
    (apiRequest as jest.Mock).mockResolvedValue({
      games: mockGames,
      page: 1,
      totalPages: 2,
      total: 2,
      limit: 1,
    });

    render(<GamesPage />);

    // Simulate initial fetch
    await waitFor(() => {
      expect(screen.getByText("Elden Ring")).toBeInTheDocument();
    });

    // Simulate page change
    const nextPageButton = screen.getByText(/Next/i);
    fireEvent.click(nextPageButton);

    // Wait for the new page fetch
    await waitFor(() => {
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    });
  });
});
