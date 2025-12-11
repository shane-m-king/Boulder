import { NextRequest } from "next/server";
import { GET } from "@/app/api/users/[id]/reviews/route";
import connect from "@/dbConfig/dbConfig";
import Review from "@/models/reviewModel";
import User from "@/models/userModel";
import Game from "@/models/gameModel";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const makeRequest = (url: string, token?: string) => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Cookie = `token=${token}`;
  return new NextRequest(url, { headers });
};

describe("/api/users/[id]/reviews Route", () => {
  let testUser: any;
  let otherUser: any;
  let token: string;
  let testGame1: any;
  let testGame2: any;
  let testGame3: any;

  beforeAll(async () => {
    jest.resetModules();
    await connect();

    await Promise.all([
      Review.deleteMany({}),
      User.deleteMany({}),
      Game.deleteMany({}),
    ]);

    // Create users
    testUser = await User.create({
      username: "reviewUser",
      email: "reviewuser@test.com",
      password: "password123",
    });

    otherUser = await User.create({
      username: "otherUser",
      email: "otheruser@test.com",
      password: "password123",
    });

    // Create games
    testGame1 = await Game.create({
      title: "Game One",
      summary: "First test game",
      genres: ["RPG"],
      platforms: ["PC"],
      thumbnailUrl: "",
      IGDBid: 1,
      releaseDate: new Date(),
    });

    testGame2 = await Game.create({
      title: "Game Two",
      summary: "Second test game",
      genres: ["Action"],
      platforms: ["Switch"],
      thumbnailUrl: "",
      IGDBid: 2,
      releaseDate: new Date(),
    });

    testGame3 = await Game.create({
      title: "Game Three",
      summary: "Third test game",
      genres: ["Strategy"],
      platforms: ["PC"],
      thumbnailUrl: "",
      IGDBid: 3,
      releaseDate: new Date(),
    });

    // Create reviews for testUser
    await Review.insertMany([
      {
        user: testUser._id,
        game: testGame1._id,
        rating: 8,
        title: "Solid Game",
        reviewBody: "Enjoyed it a lot",
      },
      {
        user: testUser._id,
        game: testGame2._id,
        rating: 9,
        title: "Amazing Game",
        reviewBody: "Highly recommend",
      },
      {
        user: testUser._id,
        game: testGame3._id,
        rating: 6,
        title: "Okay Game",
        reviewBody: "Not bad",
      },
    ]);

    // Token for testUser
    token = jwt.sign(
      {
        id: testUser._id.toString(),
        username: testUser.username,
        email: testUser.email,
      },
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
  it("retrieves reviews for a specific user", async () => {
    const req = makeRequest(
      `http://localhost:3000/api/users/${testUser._id}/reviews`,
      token
    );
    const res = await GET(req, {
      params: Promise.resolve({ id: testUser._id.toString() }),
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.reviews.length).toBe(3);
    expect(data.data.total).toBe(3);
    expect(data.data.page).toBe(1);
    expect(data.data.totalPages).toBe(1);
  });

  it("applies pagination correctly", async () => {
    const req = makeRequest(
      `http://localhost:3000/api/users/${testUser._id}/reviews?page=2&limit=2`,
      token
    );
    const res = await GET(req, {
      params: Promise.resolve({ id: testUser._id.toString() }),
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.reviews.length).toBe(1);
    expect(data.data.page).toBe(2);
    expect(data.data.limit).toBe(2);
    expect(data.data.total).toBe(3);
    expect(data.data.totalPages).toBe(2);
  });

  it("sorts reviews ascending by title", async () => {
    const req = makeRequest(
      `http://localhost:3000/api/users/${testUser._id}/reviews?sortField=title&sortOrder=asc`,
      token
    );
    const res = await GET(req, {
      params: Promise.resolve({ id: testUser._id.toString() }),
    });
    const data = await res.json();

    const titles = data.data.reviews.map((r: any) => r.title);
    expect(titles).toEqual(["Amazing Game", "Okay Game", "Solid Game"]);
  });

  it("returns 400 for invalid user ID", async () => {
    const req = makeRequest(
      "http://localhost:3000/api/users/invalid-id/reviews",
      token
    );
    const res = await GET(req, { params: Promise.resolve({ id: "invalid-id" }) });
    expect(res.status).toBe(400);
  });

  it("returns empty results for user with no reviews", async () => {
    const req = makeRequest(
      `http://localhost:3000/api/users/${otherUser._id}/reviews`,
      token
    );
    const res = await GET(req, {
      params: Promise.resolve({ id: otherUser._id.toString() }),
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.reviews.length).toBe(0);
  });

  it("prevents unauthorized access", async () => {
    const req = makeRequest(
      `http://localhost:3000/api/users/${testUser._id}/reviews`
    );
    const res = await GET(req, {
      params: Promise.resolve({ id: testUser._id.toString() }),
    });
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
  });
});
