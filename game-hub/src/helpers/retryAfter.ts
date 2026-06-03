// Formats a Retry-After value (in seconds) into a friendly, human phrase
// for messaging users after a rate-limited (429) response.
export const formatRetryAfter = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "a moment";
  if (seconds < 60) return `${seconds} second${seconds === 1 ? "" : "s"}`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
};
