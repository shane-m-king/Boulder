import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import UserGameList from "@/app/components/UserGameList";

// Mock UserGameCard
jest.mock("@/app/components/UserGameCard", () => ({
  __esModule: true,
  default: ({ userGame, review }: any) => (
    <div data-testid="mock-user-card">
      {userGame.game.title}
      {review ? ` - Review: ${review.title}` : ""}
    </div>
  ),
}));

const mockUserGames = [
  {
    _id: "1",
    status: "Owned",
    notes: "Loved it!",
    updatedAt: new Date("2025-10-01").toISOString(),
    game: {
      _id: "g1",
      title: "Hades",
      thumbnailUrl: "https://example.com/hades.jpg",
    },
  },
  {
    _id: "2",
    status: "Wishlisted",
    notes: "",
    updatedAt: new Date("2025-09-20").toISOString(),
    game: {
      _id: "g2",
      title: "Stardew Valley",
      thumbnailUrl: "https://example.com/stardew.jpg",
    },
  },
];

const mockReviewsMap = new Map<string, any>([
  [
    "g1",
    {
      title: "Fantastic roguelike",
      reviewBody: "Amazing combat and style.",
      rating: 9,
    },
  ],
]);

describe("UserGameList Component", () => {
  it("renders shimmer placeholders when loading", () => {
    render(
      <UserGameList
        userGames={[]}
        reviewsMap={new Map()}
        loading={true}
        userId="user123"
      />
    );

    const shimmerElements = screen.getAllByRole("generic");
    expect(shimmerElements.length).toBeGreaterThan(0);
  });

  it("renders user game cards when data is provided", () => {
    render(
      <UserGameList
        userGames={mockUserGames}
        reviewsMap={mockReviewsMap}
        loading={false}
        userId="user123"
      />
    );

    const cards = screen.getAllByTestId("mock-user-card");
    expect(cards.length).toBe(2);

    expect(screen.getByText(/Hades/)).toBeInTheDocument();
    expect(screen.getByText(/Stardew Valley/)).toBeInTheDocument();
  });

  it("passes the correct review from reviewsMap to each card", () => {
    render(
      <UserGameList
        userGames={mockUserGames}
        reviewsMap={mockReviewsMap}
        loading={false}
        userId="user123"
      />
    );

    // Hades should have a review
    expect(screen.getByText(/Hades - Review: Fantastic roguelike/)).toBeInTheDocument();

    // Stardew Valley should have no review
    expect(screen.getByText("Stardew Valley")).toBeInTheDocument();
    expect(screen.queryByText(/Stardew Valley - Review/)).not.toBeInTheDocument();
  });

  it("renders message when there are no games", () => {
    render(
      <UserGameList
        userGames={[]}
        reviewsMap={new Map()}
        loading={false}
        userId="user123"
      />
    );

    expect(
      screen.getByText(/no games found|no games in this library/i)
    ).toBeInTheDocument();
  });
});
