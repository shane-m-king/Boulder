import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ReviewModal from "@/app/components/ReviewModal";
import { apiRequest } from "@/helpers/apiRequest";
import { toastAction } from "@/helpers/toastAction";

// Mock dependencies
jest.mock("@/helpers/apiRequest", () => ({
  apiRequest: jest.fn(),
}));

jest.mock("@/helpers/toastAction", () => ({
  toastAction: jest.fn(() => Promise.resolve()),
}));

jest.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user123", username: "Tester" },
  }),
}));

// Helpers
const renderModal = (props = {}) => {
  const defaultProps = {
    gameId: "game123",
    reviewId: null,
    onClose: jest.fn(),
    onSuccess: jest.fn(),
    existingReview: null,
  };
  return render(<ReviewModal {...defaultProps} {...props} />);
};

describe("ReviewModal Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly in 'write review' mode", () => {
    renderModal();
    expect(screen.getByText(/write a review/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter review title/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/write your thoughts/i)).toBeInTheDocument();
  });

  it("renders correctly in 'edit review' mode", () => {
    renderModal({
      existingReview: { title: "Old Review", body: "Good!", rating: 8 },
      reviewId: "r123",
    });

    expect(screen.getByDisplayValue("Old Review")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Good!")).toBeInTheDocument();
    expect(screen.getByDisplayValue("8")).toBeInTheDocument();
    expect(screen.getByText(/edit your review/i)).toBeInTheDocument();
  });

  it("shows validation error if fields are missing", async () => {
    renderModal();
    fireEvent.click(screen.getByText(/submit review/i));

    expect(await screen.findByText(/please fill out all fields/i)).toBeInTheDocument();
    expect(toastAction).not.toHaveBeenCalled();
  });

  it("calls toastAction with POST for new reviews", async () => {
    renderModal();

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "Great Game" },
    });
    fireEvent.change(screen.getByLabelText(/rating/i), {
      target: { value: 9 },
    });
    fireEvent.change(screen.getByLabelText(/review/i), {
      target: { value: "Loved it!" },
    });

    fireEvent.click(screen.getByText(/submit review/i));

    await waitFor(() => {
      expect(toastAction).toHaveBeenCalled();
    });

    const [promise, messages] = (toastAction as jest.Mock).mock.calls[0];
    expect(messages.success).toMatch(/review submitted/i);
    expect(apiRequest).toHaveBeenCalledWith(
      "/api/reviews",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("Loved it!"),
      })
    );
  });

  it("calls toastAction with PATCH for existing review", async () => {
    renderModal({
      existingReview: { title: "Old Title", body: "Old text", rating: 5 },
      reviewId: "r123",
    });

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "Updated Title" },
    });
    fireEvent.click(screen.getByText(/submit review/i));

    await waitFor(() => {
      expect(toastAction).toHaveBeenCalled();
    });

    expect(apiRequest).toHaveBeenCalledWith(
      "/api/reviews/r123",
      expect.objectContaining({
        method: "PATCH",
        body: expect.stringContaining("Updated Title"),
      })
    );
  });

  it("calls onClose when clicking cancel", () => {
    const onClose = jest.fn();
    renderModal({ onClose });
    fireEvent.click(screen.getByText(/cancel/i));
    expect(onClose).toHaveBeenCalled();
  });
});
