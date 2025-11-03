import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/reviews/route";
import connect from "@/dbConfig/dbConfig";
import Review from "@/models/reviewModel";
import User from "@/models/userModel";
import Game from "@/models/gameModel";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const makeRequest = (url: string, method: string = "GET", body?: any, token?: string) => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Cookie = `token=${token}`;

  return new NextRequest(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
};

describe("/api/reviews Route", () => {
  let testUser: any;
  let testGame: any;
  let token: string;

  beforeAll(async () => {
    jest.resetModules();
    await connect();

    await Promise.all([
      Review.deleteMany({}),
      User.deleteMany({}),
      Game.deleteMany({}),
    ]);

    testUser = await User.create({
      username: "username",
      email: "username@test.com",
      password: "password123",
    });

    testGame = await Game.create({
      title: "Test Game",
      summary: "A test game summary",
      genres: ["RPG"],
      platforms: ["PC"],
      thumbnailUrl: "",
      releaseDate: new Date(),
    });

    token = jwt.sign(
      { id: testUser._id.toString(), username: testUser.username, email: testUser.email },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );
  });

  afterAll(async () => {
    await Promise.all([
      Review.deleteMany({}),
      User.deleteMany({}),
      Game.deleteMany({}),
    ]);
    await mongoose.connection.close();
  });

  // --GET--
  it("returns 404 with message about alternate routes", async () => {
    const req = makeRequest("http://localhost:3000/api/reviews");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/available by game or user/i);
  });

  // --POST--
  it("creates a review successfully", async () => {
    const req = makeRequest(
      "http://localhost:3000/api/reviews",
      "POST",
      {
        game: testGame._id.toString(),
        rating: 9,
        title: "Excellent",
        reviewBody: "Loved this test game!",
      },
      token
    );

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.review.title).toBe("Excellent");
    expect(data.data.review.rating).toBe(9);
  });

  it("fails when missing required fields", async () => {
    const req = makeRequest(
      "http://localhost:3000/api/reviews",
      "POST",
      {
        game: testGame._id.toString(),
        rating: 7,
      },
      token
    );

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/missing/i);
  });

  it("fails with invalid ObjectId for game", async () => {
    const req = makeRequest(
      "http://localhost:3000/api/reviews",
      "POST",
      {
        game: "invalid-id",
        rating: 7,
        title: "Bad ID",
        reviewBody: "Invalid game id test",
      },
      token
    );

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it("fails when rating is out of range", async () => {
    const req = makeRequest(
      "http://localhost:3000/api/reviews",
      "POST",
      {
        game: testGame._id.toString(),
        rating: 15,
        title: "Too high rating",
        reviewBody: "Testing invalid rating",
      },
      token
    );

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/between 1 and 10/i);
  });

  it("fails when title is too long", async () => {
    const req = makeRequest(
      "http://localhost:3000/api/reviews",
      "POST",
      {
        game: testGame._id.toString(),
        rating: 8,
        title: "!".repeat(41),
        reviewBody: "Too long title test",
      },
      token
    );

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/title must be 40/i);
  });

  it("fails when review body is too long", async () => {
    const req = makeRequest(
      "http://localhost:3000/api/reviews",
      "POST",
      {
        game: testGame._id.toString(),
        rating: 8,
        title: "Body too long",
        reviewBody: "!".repeat(401),
      },
      token
    );

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/body must be 400/i);
  });

  it("prevents duplicate reviews by same user on same game", async () => {
    // First create a review
    await Review.create({
      user: testUser._id,
      game: testGame._id,
      rating: 7,
      title: "First review",
      reviewBody: "Initial one",
    });

    // Attempt to post another
    const req = makeRequest(
      "http://localhost:3000/api/reviews",
      "POST",
      {
        game: testGame._id.toString(),
        rating: 8,
        title: "Duplicate",
        reviewBody: "Trying again",
      },
      token
    );

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/already reviewed/i);
  });

  it("fails when unauthorized", async () => {
    const req = makeRequest(
      "http://localhost:3000/api/reviews",
      "POST",
      {
        game: testGame._id.toString(),
        rating: 8,
        title: "No Auth",
        reviewBody: "Should fail due to missing token",
      }
    );

    const res = await POST(req);
    const data = await res.json();

    expect([401, 403]).toContain(res.status);
    expect(data.success).toBe(false);
  });
});
