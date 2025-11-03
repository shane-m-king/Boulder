import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/users/[id]/games/route";
import connect from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import Game from "@/models/gameModel";
import UserGame from "@/models/userGameModel";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const makeRequest = (
  url: string,
  method: string = "GET",
  body?: any,
  token?: string
) => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Cookie = `token=${token}`;
  return new NextRequest(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
};

describe("/api/users/[id]/games Route", () => {
  let testUser: any;
  let otherUser: any;
  let token: string;
  let testGames: any[];

  beforeAll(async () => {
    jest.resetModules();
    await connect();

    await Promise.all([
      User.deleteMany({}),
      Game.deleteMany({}),
      UserGame.deleteMany({}),
    ]);

    // Create users
    testUser = await User.create({
      username: "gameUser",
      email: "gameuser@test.com",
      password: "password123",
    });

    otherUser = await User.create({
      username: "otherUser",
      email: "otheruser@test.com",
      password: "password456",
    });

    // Create games
    testGames = await Game.insertMany([
      {
        title: "Elden Ring",
        summary: "Open world RPG",
        genres: ["RPG"],
        platforms: ["PC"],
        thumbnailUrl: "",
        releaseDate: new Date("2022-02-25"),
      },
      {
        title: "Celeste",
        summary: "Platformer about climbing a mountain",
        genres: ["Platformer"],
        platforms: ["Switch"],
        thumbnailUrl: "",
        releaseDate: new Date("2018-01-25"),
      },
      {
        title: "Hades",
        summary: "Action roguelike",
        genres: ["Action"],
        platforms: ["PC"],
        thumbnailUrl: "",
        releaseDate: new Date("2020-09-17"),
      },
    ]);

    // Add games to user profile
    await UserGame.insertMany([
      { user: testUser._id, game: testGames[0]._id, status: "Owned" },
      { user: testUser._id, game: testGames[1]._id, status: "Wishlisted" },
      { user: testUser._id, game: testGames[2]._id, status: "Owned" },
    ]);

    // Create token
    token = jwt.sign(
      { id: testUser._id.toString(), username: testUser.username },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );
  });

  afterAll(async () => {
    await Promise.all([
      User.deleteMany({}),
      Game.deleteMany({}),
      UserGame.deleteMany({}),
    ]);
    await mongoose.connection.close();
  });

  // --GET--
  it("retrieves games for a user successfully", async () => {
    const req = makeRequest(
      `http://localhost:3000/api/users/${testUser._id}/games`,
      "GET",
      undefined,
      token
    );
    const res = await GET(req, {
      params: Promise.resolve({ id: testUser._id.toString() }),
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.userGames.length).toBe(3);
    expect(data.data.total).toBe(3);
  });

  it("applies pagination correctly", async () => {
    const req = makeRequest(
      `http://localhost:3000/api/users/${testUser._id}/games?page=2&limit=2`,
      "GET",
      undefined,
      token
    );
    const res = await GET(req, {
      params: Promise.resolve({ id: testUser._id.toString() }),
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.userGames.length).toBe(1);
    expect(data.data.page).toBe(2);
    expect(data.data.limit).toBe(2);
    expect(data.data.totalPages).toBe(2);
  });

  it("filters by status", async () => {
    const req = makeRequest(
      `http://localhost:3000/api/users/${testUser._id}/games?status=Owned`,
      "GET",
      undefined,
      token
    );
    const res = await GET(req, {
      params: Promise.resolve({ id: testUser._id.toString() }),
    });
    const data = await res.json();

    const statuses = data.data.userGames.map((ug: any) => ug.status);
    expect(statuses.every((s: string) => s === "Owned")).toBe(true);
  });

  it("searches games by title", async () => {
    const req = makeRequest(
      `http://localhost:3000/api/users/${testUser._id}/games?search=Celeste`,
      "GET",
      undefined,
      token
    );
    const res = await GET(req, {
      params: Promise.resolve({ id: testUser._id.toString() }),
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.userGames.length).toBe(1);
    expect(data.data.userGames[0].game.title).toBe("Celeste");
  });

  it("returns 400 for invalid user ID", async () => {
    const req = makeRequest(
      `http://localhost:3000/api/users/invalid-id/games`,
      "GET",
      undefined,
      token
    );
    const res = await GET(req, { params: Promise.resolve({ id: "invalid-id" }) });
    expect(res.status).toBe(400);
  });

  it("prevents access when unauthorized", async () => {
    const req = makeRequest(
      `http://localhost:3000/api/users/${testUser._id}/games`
    );
    const res = await GET(req, {
      params: Promise.resolve({ id: testUser._id.toString() }),
    });
    expect(res.status).toBe(401);
  });

  // --POST--
  it("adds a game successfully to user's profile", async () => {
    const newGame = await Game.create({
      title: "Hollow Knight",
      summary: "Metroidvania adventure",
      genres: ["Action"],
      platforms: ["PC"],
      thumbnailUrl: "",
      releaseDate: new Date("2017-02-24")
    });

    const req = makeRequest(
      `http://localhost:3000/api/users/${testUser._id}/games`,
      "POST",
      { game: newGame._id, status: "Owned", notes: "One of my favorites!" },
      token
    );
    const res = await POST(req, {
      params: Promise.resolve({ id: testUser._id.toString() }),
    });
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.game.game.title).toBe("Hollow Knight");
  });

  it("prevents duplicate game entries", async () => {
    const req = makeRequest(
      `http://localhost:3000/api/users/${testUser._id}/games`,
      "POST",
      { game: testGames[0]._id, status: "Owned" },
      token
    );
    const res = await POST(req, {
      params: Promise.resolve({ id: testUser._id.toString() }),
    });
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(data.error).toMatch(/already added/);
  });

  it("prevents adding a game when unauthorized user tries", async () => {
    const otherToken = jwt.sign(
      { id: otherUser._id.toString(), username: otherUser.username },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    const req = makeRequest(
      `http://localhost:3000/api/users/${testUser._id}/games`,
      "POST",
      { game: testGames[1]._id, status: "Owned" },
      otherToken
    );

    const res = await POST(req, {
      params: Promise.resolve({ id: testUser._id.toString() }),
    });
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe("Unauthorized");
  });

  it("fails when notes exceed 400 characters", async () => {
    const longNote = "!".repeat(401);
    const newGame = await Game.create({
      title: "Breathe of the Wild",
      summary: "Open world adventure",
      genres: ["Adventure"],
      platforms: ["Switch"],
      thumbnailUrl: "",
      releaseDate: new Date("2017-03-03")
    });
    const req = makeRequest(
      `http://localhost:3000/api/users/${testUser._id}/games`,
      "POST",
      { game: newGame._id, notes: longNote },
      token
    );
    const res = await POST(req, {
      params: Promise.resolve({ id: testUser._id.toString() }),
    });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/400 characters or less/);
  });
});
