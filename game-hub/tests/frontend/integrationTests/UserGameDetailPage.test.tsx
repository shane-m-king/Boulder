import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import UserGameDetailPage from "@/app/profile/[id]/games/[gameId]/page";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/helpers/apiRequest";
import { toastAction } from "@/helpers/toastAction";
import toast from "react-hot-toast";

// Router mock
jest.mock("next/navigation", () => ({
  ...jest.requireActual("next/navigation"),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useParams: () => ({ id: "user123", gameId: "game456" }),
}));

// Other mocks
jest.mock("@/contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/helpers/apiRequest", () => ({
  apiRequest: jest.fn(),
}));

jest.mock("@/helpers/toastAction", () => ({
  toastAction: jest.fn(),
}));

jest.mock("react-hot-toast", () => ({
  error: jest.fn(),
}));

describe("/profile/[id]/games/[gameId] page integration", () => {
  beforeEach(() => {
  jest.clearAllMocks();
  jest.resetAllMocks();
});

  const mockParams = Promise.resolve({ id: "user123", gameId: "game456" });

  const mockUser = {
    id: "user123",
    username: "Tester",
    email: "test@example.com",
  };

  const mockUserGameResponse = {
    userGame: {
      _id: "ug1",
      status: "Owned",
      notes: "Really enjoyed this one.",
      updatedAt: new Date().toISOString(),
      game: {
        _id: "game456",
        title: "Elden Ring",
        thumbnailUrl: "",
        genres: ["Action", "RPG"],
        platforms: ["PC"],
        releaseDate: new Date().toISOString(),
      },
    },
  };

  const mockReviewsResponse = {
    reviews: [
      {
        _id: "r1",
        title: "Amazing Experience",
        reviewBody: "A truly incredible journey.",
        rating: 10,
        game: "game456",
        updatedAt: new Date().toISOString(),
      },
    ],
  };

  it("renders game details and review successfully", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });

    (apiRequest as jest.Mock)
      // Fetch reviews
      .mockResolvedValueOnce(mockReviewsResponse)
      // Fetch userGame
      .mockResolvedValueOnce(mockUserGameResponse);

    render(<UserGameDetailPage params={mockParams} />);

    // Wait for the title to appear
    await screen.findByText("Elden Ring");

    // Game info
    expect(screen.getByText("Elden Ring")).toBeInTheDocument();
    expect(screen.getByText(/really enjoyed this one/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue("Owned")).toBeInTheDocument();

    // Review section
    expect(screen.getByText("Amazing Experience")).toBeInTheDocument();
    expect(screen.getByText(/a truly incredible journey/i)).toBeInTheDocument();
    expect(screen.getByText(/10/i)).toBeInTheDocument();

    // Buttons visible for owner
    expect(screen.getByText(/save changes/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /review/i })).toBeInTheDocument();

    // Back link
    expect(screen.getByText(/back to my games/i)).toBeInTheDocument();
  });

  it("renders message when game not found", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });

    (apiRequest as jest.Mock)
      .mockResolvedValueOnce({ reviews: [] })
      .mockRejectedValueOnce(new Error("Game not found"));

    render(<UserGameDetailPage params={mockParams} />);

    await screen.findByText(/game not found/i);
    expect(screen.getByText(/game not found/i)).toBeInTheDocument();
  });

  it("shows toast on API failure", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });

    (apiRequest as jest.Mock).mockRejectedValue(new Error("Network error"));

    render(<UserGameDetailPage params={mockParams} />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Network error");
    });
  });

  it("handles saving changes successfully", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });

    (apiRequest as jest.Mock)
      .mockResolvedValueOnce(mockReviewsResponse)
      .mockResolvedValueOnce(mockUserGameResponse);

    (toastAction as jest.Mock).mockResolvedValueOnce({
      success: true,
    });

    render(<UserGameDetailPage params={mockParams} />);

    // Wait for save button
    const saveButton = await screen.findByText(/save changes/i);
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(toastAction).toHaveBeenCalled();
    });
  });
});
