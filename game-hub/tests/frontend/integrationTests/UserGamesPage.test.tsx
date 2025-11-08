import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import UserGamesPage from "@/app/profile/[id]/games/page";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/helpers/apiRequest";
import toast from "react-hot-toast";

// Mock app router
jest.mock("next/navigation", () => ({
  ...jest.requireActual("next/navigation"),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => "/profile/test",
  useParams: () => ({ id: "test" }),
}));

// Other mocks
jest.mock("@/contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/helpers/apiRequest", () => ({
  apiRequest: jest.fn(),
}));

jest.mock("react-hot-toast", () => ({
  error: jest.fn(),
}));

describe("/profile/[id]/games page integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockParams = Promise.resolve({ id: "user123" });

  const mockUser = {
    id: "user123",
    username: "Tester",
    email: "test@example.com",
  };

  const mockGamesResponse = {
    userGames: [
      {
        _id: "lib1",
        status: "Owned",
        notes: "One of my favorites!",
        updatedAt: new Date().toISOString(),
        game: { _id: "g1", title: "Elden Ring", thumbnailUrl: "" },
      },
      {
        _id: "lib2",
        status: "Wishlisted",
        notes: "",
        updatedAt: new Date().toISOString(),
        game: { _id: "g2", title: "Celeste", thumbnailUrl: "" },
      },
    ],
    page: 1,
    totalPages: 1,
    total: 2,
    limit: 10,
  };

  const mockReviewsResponse = {
    reviews: [
      {
        _id: "r1",
        title: "Incredible",
        rating: 9,
        reviewBody: "Loved every minute!",
        game: { _id: "g1" },
      },
    ],
  };

  it("renders loading shimmer skeletons initially", async () => {
  (useAuth as jest.Mock).mockReturnValue({
    user: mockUser,
    loading: false, // let the page render
  });

  // Keep API unresolved so internal loading remains true
  (apiRequest as jest.Mock).mockImplementation(() => new Promise(() => {}));

  render(<UserGamesPage params={mockParams} />);

  // Wait for shimmer to appear
  const shimmer = await screen.findByRole("region", { hidden: true }).catch(() => null);

  // Fallback check if role not defined — use class selector
  const shimmerElements = document.querySelectorAll(".animate-pulse");
  expect(shimmerElements.length).toBeGreaterThan(0);
});

  it("renders fetched user games and reviews successfully", async () => {
  (useAuth as jest.Mock).mockReturnValue({
    user: mockUser,
    loading: false,
  });

  (apiRequest as jest.Mock)
    // Fetch user games
    .mockResolvedValueOnce(mockGamesResponse)
    // Fetch user reviews
    .mockResolvedValueOnce(mockReviewsResponse);

  render(<UserGamesPage params={mockParams} />);

  // Wait until loading text/skeletons are gone
  await waitFor(() => {
    expect(
      screen.queryByText((content) =>
        content.toLowerCase().includes("loading user library")
      )
    ).not.toBeInTheDocument();
  });

  // Wait until a known game title appears
  await screen.findByText((text) => text.includes("Elden Ring"));
  await screen.findByText((text) => text.includes("Celeste"));

  // Validate game content and review info
  expect(screen.getByText(/one of my favorites/i)).toBeInTheDocument();
  expect(screen.getByText(/incredible/i)).toBeInTheDocument();
});

  it("renders message if user has no games", async () => {
  (useAuth as jest.Mock).mockReturnValue({
    user: mockUser,
    loading: false,
  });

  (apiRequest as jest.Mock)
    // Fetch user games
    .mockResolvedValueOnce({
      userGames: [],
      page: 1,
      totalPages: 1,
      total: 0,
      limit: 10,
    })
    // Fetch user reviews
    .mockResolvedValueOnce({ reviews: [] });

  render(<UserGamesPage params={mockParams} />);

  // Wait for empty library message
  await screen.findByText(/no games.*library/i);

  expect(screen.getByText(/no games.*library/i)).toBeInTheDocument();
});

  it("shows toast on API failure", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });

    (apiRequest as jest.Mock).mockRejectedValue(new Error("Failed to fetch"));

    render(<UserGamesPage params={mockParams} />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to fetch");
    });
  });

  it("handles pagination buttons", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });

    (apiRequest as jest.Mock)
      .mockResolvedValueOnce({ ...mockGamesResponse, totalPages: 2 }) // page 1
      .mockResolvedValueOnce(mockReviewsResponse)
      .mockResolvedValueOnce({ ...mockGamesResponse, page: 2 }) // page 2
      .mockResolvedValueOnce(mockReviewsResponse);

    render(<UserGamesPage params={mockParams} />);

    await screen.findByText("Next");

    fireEvent.click(screen.getByText("Next"));

    await waitFor(() => {
      // Two calls per page: userGames + reviews
      expect(apiRequest).toHaveBeenCalledTimes(4);
    });
  });
});
