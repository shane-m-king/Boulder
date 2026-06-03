import { NextRequest } from "next/server";
import { POST as loginPOST } from "@/app/api/auth/login/route";
import connect from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import RateLimit from "@/models/rateLimitModel";
import { checkRateLimit, AUTH_RATE_LIMIT } from "@/helpers/rateLimit";
import mongoose from "mongoose";

const makeLoginRequest = (body: any, ip: string) =>
  new NextRequest("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });

describe("Auth rate limiting", () => {
  beforeAll(async () => {
    jest.resetModules();
    await connect();
    await Promise.all([User.deleteMany({}), RateLimit.deleteMany({})]);
  });

  afterAll(async () => {
    await RateLimit.deleteMany({});
    await mongoose.connection.close();
  });

  // --helper--
  it("allows up to max attempts, then limits", async () => {
    const key = "unit-test:key";
    await RateLimit.deleteMany({ key });

    for (let i = 0; i < AUTH_RATE_LIMIT.max; i++) {
      const result = await checkRateLimit(key, AUTH_RATE_LIMIT);
      expect(result.limited).toBe(false);
    }

    const blocked = await checkRateLimit(key, AUTH_RATE_LIMIT);
    expect(blocked.limited).toBe(true);
    expect(blocked.retryAfter).toBeGreaterThan(0);
    expect(blocked.remaining).toBe(0);
  });

  it("tracks separate windows per key", async () => {
    const resultA = await checkRateLimit("ip-a:login", AUTH_RATE_LIMIT);
    const resultB = await checkRateLimit("ip-b:login", AUTH_RATE_LIMIT);

    expect(resultA.limited).toBe(false);
    expect(resultB.limited).toBe(false);
    expect(resultA.remaining).toBe(AUTH_RATE_LIMIT.max - 1);
    expect(resultB.remaining).toBe(AUTH_RATE_LIMIT.max - 1);
  });

  // --integration--
  it("returns 429 with Retry-After after too many login attempts", async () => {
    const ip = "203.0.113.7";

    // First `max` attempts are allowed through (and fail auth with 401)
    for (let i = 0; i < AUTH_RATE_LIMIT.max; i++) {
      const res = await loginPOST(
        makeLoginRequest({ username: "nobody", password: "wrong" }, ip)
      );
      expect(res.status).toBe(401);
    }

    // The next attempt is rate limited
    const blocked = await loginPOST(
      makeLoginRequest({ username: "nobody", password: "wrong" }, ip)
    );
    const data = await blocked.json();

    expect(blocked.status).toBe(429);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/too many login attempts/i);
    expect(blocked.headers.get("Retry-After")).toBeTruthy();
  });

  it("limits each IP independently", async () => {
    const res = await loginPOST(
      makeLoginRequest({ username: "nobody", password: "wrong" }, "198.51.100.42")
    );
    // A fresh IP is unaffected by another IP hitting the limit
    expect(res.status).toBe(401);
  });
});
