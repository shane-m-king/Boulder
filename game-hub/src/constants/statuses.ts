// Statuses for users to set for specific games on their profiles
// Part of userGame Model

export const STATUSES = ["Owned", "Wishlisted", "Not Owned"] as const;
export type Status = typeof STATUSES[number];