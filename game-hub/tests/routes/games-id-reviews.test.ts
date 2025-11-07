import { NextRequest } from "next/server";
import { GET } from "@/app/api/games/[id]/reviews/route";
import connect from "@/dbConfig/dbConfig";
import Game from "@/models/gameModel";
import User from "@/models/userModel";
import Review from "@/models/reviewModel";
import mongoose from "mongoose";

const makeRequest = (url: string) => new NextRequest(url);

describe("/api/games/[id]/reviews Route", () => {
  let testGame: any;
  let testUsers: any[] = [];
  let testReviews: any[] = [];

  beforeAll(async () => {
    jest.resetModules();
    await connect();

    await Promise.all([
      Game.deleteMany({}),
      User.deleteMany({}),
      Review.deleteMany({}),
    ]);

    // Create a game
    testGame = await Game.create({
      title: "Test Game",
      summary: "A test game",
      genres: ["Adventure"],
      platforms: ["PC"],
      thumbnailUrl: "",
      releaseDate: new Date(),
    });

    // Create users
    testUsers = await User.insertMany([
      { username: "alice", email: "alice@test.com", password: "password1" },
      { username: "bob", email: "bob@test.com", password: "password2" },
      { username: "carol", email: "carol@test.com", password: "password3" },
    ]);

    // Create reviews
    testReviews = await Review.insertMany([
      { user: testUsers[0]._id, game: testGame._id, rating: 8, title: "Loved it", reviewBody: "Amazing!" },
      { user: testUsers[1]._id, game: testGame._id, rating: 6, title: "Not bad", reviewBody: "It was okay." },
      { user: testUsers[2]._id, game: testGame._id, rating: 9, title: "Fantastic", reviewBody: "Highly recommend!" },
    ]);
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
  it("retrieves all reviews for single game", async () => {
    const req = makeRequest(`http://localhost:3000/api/games/${testGame._id}/reviews`);
    const res = await GET(req, { params: Promise.resolve({ id: testGame._id.toString() }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.reviews.length).toBe(3);
  });

  it("paginates reviews correctly", async () => {
    const req = makeRequest(
      `http://localhost:3000/api/games/${testGame._id}/reviews?page=1&limit=2`
    );
    const res = await GET(req, { params: Promise.resolve({ id: testGame._id.toString() }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.reviews.length).toBe(2);
    expect(data.data.total).toBe(3);
    expect(data.data.totalPages).toBe(2);
  });

  it("returns error for invalid game ID", async () => {
    const req = makeRequest(`http://localhost:3000/api/games/invalid-id/reviews`);
    const res = await GET(req, { params: Promise.resolve({ id: "invalid-id" }) });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
  });
});
