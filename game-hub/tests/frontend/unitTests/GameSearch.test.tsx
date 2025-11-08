import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import GameSearch from "@/app/components/GameSearch";

// Mock Loader2 icon from lucide-react
jest.mock("lucide-react", () => ({
  Loader2: () => <div data-testid="loader" />,
}));

describe("GameSearch Component", () => {
  const mockSetSearch = jest.fn();
  const mockSetGenre = jest.fn();
  const mockSetPlatform = jest.fn();
  const mockClearFilters = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all form inputs and labels", () => {
    render(
      <GameSearch
        search=""
        setSearch={mockSetSearch}
        genre=""
        setGenre={mockSetGenre}
        platform=""
        setPlatform={mockSetPlatform}
        clearFilters={mockClearFilters}
        isSearching={false}
      />
    );

    expect(screen.getByLabelText(/Search/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Genre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Platform/i)).toBeInTheDocument();
  });

  it("updates search value on input change", () => {
    render(
      <GameSearch
        search=""
        setSearch={mockSetSearch}
        genre=""
        setGenre={mockSetGenre}
        platform=""
        setPlatform={mockSetPlatform}
        clearFilters={mockClearFilters}
        isSearching={false}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Search games/i);
    fireEvent.change(searchInput, { target: { value: "Hades" } });
    expect(mockSetSearch).toHaveBeenCalledWith("Hades");
  });

  it("updates genre and platform when selected", () => {
    render(
      <GameSearch
        search=""
        setSearch={mockSetSearch}
        genre=""
        setGenre={mockSetGenre}
        platform=""
        setPlatform={mockSetPlatform}
        clearFilters={mockClearFilters}
        isSearching={false}
      />
    );

    const genreSelect = screen.getByLabelText(/Genre/i);
    const platformSelect = screen.getByLabelText(/Platform/i);

    fireEvent.change(genreSelect, { target: { value: "Action" } });
    fireEvent.change(platformSelect, { target: { value: "PC" } });

    expect(mockSetGenre).toHaveBeenCalledWith("Action");
    expect(mockSetPlatform).toHaveBeenCalledWith("PC");
  });

  it("renders loader icon when isSearching is true", () => {
    render(
      <GameSearch
        search="Test"
        setSearch={mockSetSearch}
        genre=""
        setGenre={mockSetGenre}
        platform=""
        setPlatform={mockSetPlatform}
        clearFilters={mockClearFilters}
        isSearching={true}
      />
    );

    expect(screen.getByTestId("loader")).toBeInTheDocument();
  });

  it("renders and triggers clear filters button when filters are active", () => {
    render(
      <GameSearch
        search="Halo"
        setSearch={mockSetSearch}
        genre="Action"
        setGenre={mockSetGenre}
        platform=""
        setPlatform={mockSetPlatform}
        clearFilters={mockClearFilters}
        isSearching={false}
      />
    );

    const clearButton = screen.getByRole("button", { name: /Clear filters/i });
    expect(clearButton).toBeInTheDocument();

    fireEvent.click(clearButton);
    expect(mockClearFilters).toHaveBeenCalledTimes(1);
  });

  it("does not render clear button when no filters are active", () => {
    render(
      <GameSearch
        search=""
        setSearch={mockSetSearch}
        genre=""
        setGenre={mockSetGenre}
        platform=""
        setPlatform={mockSetPlatform}
        clearFilters={mockClearFilters}
        isSearching={false}
      />
    );

    expect(screen.queryByText(/Clear filters/i)).not.toBeInTheDocument();
  });
});
