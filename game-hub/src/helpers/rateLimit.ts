import { NextRequest } from "next/server";
import RateLimit from "@/models/rateLimitModel";

// Fine-grained policy: 5 attempts per 15 minutes. For login this is keyed by
// IP+username so users behind a shared IP don't pool attempts, and a success
// against one account can't be used to reset attempts against another.
export const AUTH_RATE_LIMIT = { max: 5, windowMs: 15 * 60 * 1000 };

// Coarse per-IP backstop for login: catches username enumeration (spreading
// attempts across many accounts from one IP) without locking out shared IPs.
export const AUTH_IP_RATE_LIMIT = { max: 20, windowMs: 15 * 60 * 1000 };

interface RateLimitOptions {
  max: number;
  windowMs: number;
}

export interface RateLimitResult {
  limited: boolean;
  retryAfter: number; // seconds until the window resets
  remaining: number;
}

// Derives the client IP from proxy headers (Vercel sets x-forwarded-for).
export const getClientIp = (request: NextRequest): string => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
};

// Fixed-window counter backed by MongoDB so it works across serverless
// instances. Fails open: a limiter error must never lock out real users.
export const checkRateLimit = async (
  key: string,
  { max, windowMs }: RateLimitOptions
): Promise<RateLimitResult> => {
  const now = Date.now();

  try {
    // Increment within an active (unexpired) window
    let doc = await RateLimit.findOneAndUpdate(
      { key, expiresAt: { $gt: new Date(now) } },
      { $inc: { count: 1 } },
      { new: true }
    );

    // No active window: start a fresh one (also resets an expired record)
    if (!doc) {
      doc = await RateLimit.findOneAndUpdate(
        { key },
        { $set: { count: 1, expiresAt: new Date(now + windowMs) } },
        { new: true, upsert: true }
      );
    }

    const retryAfter = Math.max(
      0,
      Math.ceil((doc.expiresAt.getTime() - now) / 1000)
    );

    return {
      limited: doc.count > max,
      retryAfter,
      remaining: Math.max(0, max - doc.count),
    };
  } catch (error) {
    console.error("Rate limit check failed: ", error);
    return { limited: false, retryAfter: 0, remaining: max };
  }
};
