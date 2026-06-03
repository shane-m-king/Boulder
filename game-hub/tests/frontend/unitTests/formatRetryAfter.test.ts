import { formatRetryAfter } from "@/helpers/retryAfter";

describe("formatRetryAfter", () => {
  it("falls back to 'a moment' for zero, negative, or invalid input", () => {
    expect(formatRetryAfter(0)).toBe("a moment");
    expect(formatRetryAfter(-5)).toBe("a moment");
    expect(formatRetryAfter(NaN)).toBe("a moment");
  });

  it("formats sub-minute values in seconds with correct pluralization", () => {
    expect(formatRetryAfter(1)).toBe("1 second");
    expect(formatRetryAfter(45)).toBe("45 seconds");
  });

  it("rounds up to whole minutes with correct pluralization", () => {
    expect(formatRetryAfter(60)).toBe("1 minute");
    expect(formatRetryAfter(61)).toBe("2 minutes");
    expect(formatRetryAfter(900)).toBe("15 minutes");
  });
});
