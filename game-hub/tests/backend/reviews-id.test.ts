// tests/route/reviews-id.test.ts
import { NextRequest } from "next/server";
import { GET, PATCH, DELETE } from "@/app/api/reviews/[id]/route";
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

describe("/api/reviews/[id] Route", () => {
  let testUser: any;
  let otherUser: any;
  let testGame: any;
  let otherGame: any;
  let testReview: any;
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
      username: "reviewUser",
      email: "review@test.com",
      password: "hashedpassword",
    });

    otherUser = await User.create({
      username: "otherUser",
      email: "other@test.com",
      password: "hashedpassword",
    });

    testGame = await Game.create({
      title: "Test Game",
      summary: "A test game",
      genres: ["RPG"],
      platforms: ["PC"],
      thumbnailUrl: "",
      IGDBid: 1,
      releaseDate: new Date(),
    });

    otherGame = await Game.create({
      title: "otherGame",
      summary: "Another game",
      genres: ["Action"],
      platforms: ["Switch"],
      thumbnailUrl: "",
      IGDBid: 2,
      releaseDate: new Date(),
    });

    testReview = await Review.create({
      user: testUser._id,
      game: testGame._id,
      rating: 8,
      title: "Good game",
      reviewBody: "Enjoyed it",
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
  it("retrieves a review by ID", async () => {
    const req = makeRequest(`http://localhost:3000/api/reviews/${testReview._id}`);
    const res = await GET(req, { params: Promise.resolve({ id: testReview._id.toString() }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.review.title).toBe("Good game");
  });

  it("returns 404 for nonexistent review", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const req = makeRequest(`http://localhost:3000/api/reviews/${fakeId}`);
    const res = await GET(req, { params: Promise.resolve({ id: fakeId.toString() }) });
    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid ID", async () => {
    const req = makeRequest("http://localhost:3000/api/reviews/invalid-id");
    const res = await GET(req, { params: Promise.resolve({ id: "invalid-id" }) });
    expect(res.status).toBe(400);
  });

  // --PATCH--
  it("updates review successfully", async () => {
    const req = makeRequest(
      `http://localhost:3000/api/reviews/${testReview._id}`,
      "PATCH",
      { title: "Updated Review", rating: 9 },
      token
    );

    const res = await PATCH(req, { params: Promise.resolve({ id: testReview._id.toString() }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.review.title).toBe("Updated Review");
    expect(data.data.review.rating).toBe(9);
  });

  it("fails when unauthorized user attempts update", async () => {
    const otherToken = jwt.sign(
      { id: otherUser._id.toString(), username: otherUser.username },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    const req = makeRequest(
      `http://localhost:3000/api/reviews/${testReview._id}`,
      "PATCH",
      { title: "Illegal update" },
      otherToken
    );

    const res = await PATCH(req, { params: Promise.resolve({ id: testReview._id.toString() }) });
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe("Unauthorized");
  });

  it("fails with invalid rating", async () => {
    const req = makeRequest(
      `http://localhost:3000/api/reviews/${testReview._id}`,
      "PATCH",
      { rating: 15 },
      token
    );

    const res = await PATCH(req, { params: Promise.resolve({ id: testReview._id.toString() }) });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/between 0 and 10/);
  });

  // --DELETE--
  it("deletes a review successfully", async () => {
    const reviewToDelete = await Review.create({
      user: testUser._id,
      game: otherGame._id,
      rating: 6,
      title: "Delete me",
      reviewBody: "Temporary review",
    });

    const req = makeRequest(
      `http://localhost:3000/api/reviews/${reviewToDelete._id}`,
      "DELETE",
      undefined,
      token
    );

    const res = await DELETE(req, { params: Promise.resolve({ id: reviewToDelete._id.toString() }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);

    const deleted = await Review.findById(reviewToDelete._id);
    expect(deleted).toBeNull();
  });

  it("prevents unauthorized deletion", async () => {
    const reviewToDelete = await Review.create({
      user: otherUser._id,
      game: testGame._id,
      rating: 7,
      title: "Protected review",
      reviewBody: "Should not be deletable",
    });

    const req = makeRequest(
      `http://localhost:3000/api/reviews/${reviewToDelete._id}`,
      "DELETE",
      undefined,
      token
    );

    const res = await DELETE(req, { params: Promise.resolve({ id: reviewToDelete._id.toString() }) });
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe("Unauthorized");
  });
});
