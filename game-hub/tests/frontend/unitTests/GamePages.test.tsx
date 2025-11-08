import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import GamePages from "@/app/components/GamePages";

describe("GamePages Component", () => {
  it("renders pagination buttons for small page counts", () => {
    render(<GamePages page={1} totalPages={3} setPage={jest.fn()} />);

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("disables 'Previous' when on the first page", () => {
    render(<GamePages page={1} totalPages={5} setPage={jest.fn()} />);
    expect(screen.getByRole("button", { name: /Previous/i })).toBeDisabled();
  });

  it("disables 'Next' when on the last page", () => {
    render(<GamePages page={5} totalPages={5} setPage={jest.fn()} />);
    expect(screen.getByRole("button", { name: /Next/i })).toBeDisabled();
  });

  it("calls setPage when clicking page numbers", () => {
    const mockSetPage = jest.fn();
    render(<GamePages page={1} totalPages={5} setPage={mockSetPage} />);

    fireEvent.click(screen.getByText("3"));
    expect(mockSetPage).toHaveBeenCalledWith(3);
  });

  it("calls setPage with correct values when clicking 'Previous' and 'Next'", () => {
    const mockSetPage = jest.fn();
    render(<GamePages page={3} totalPages={5} setPage={mockSetPage} />);

    fireEvent.click(screen.getByRole("button", { name: /Previous/i }));
    expect(mockSetPage).toHaveBeenCalledWith(2);

    fireEvent.click(screen.getByRole("button", { name: /Next/i }));
    expect(mockSetPage).toHaveBeenCalledWith(4);
  });

  it("renders ellipses when there are many total pages", () => {
    render(<GamePages page={10} totalPages={25} setPage={jest.fn()} />);
    expect(screen.getAllByText("…").length).toBeGreaterThan(0);
  });
});
