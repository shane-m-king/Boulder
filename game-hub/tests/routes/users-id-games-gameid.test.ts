import { NextRequest } from "next/server";
import { GET, PATCH, DELETE } from "@/app/api/users/[id]/games/[gameId]/route";
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

describe("/api/users/[id]/games/[gameId] Route", () => {
  let testUser: any;
  let otherUser: any;
  let testGame: any;
  let token: string;

  beforeAll(async () => {
    jest.resetModules();
    await connect();

    await Promise.all([
      User.deleteMany({}),
      Game.deleteMany({}),
      UserGame.deleteMany({}),
    ]);

    testUser = await User.create({
      username: "userOne",
      email: "user1@test.com",
      password: "password123",
    });

    otherUser = await User.create({
      username: "userTwo",
      email: "user2@test.com",
      password: "password456",
    });

    testGame = await Game.create({
      title: "Hollow Knight",
      summary: "Metroidvania adventure",
      genres: ["Action"],
      platforms: ["PC"],
      thumbnailUrl: "",
      releaseDate: new Date("2017-02-24"),
    });

    await UserGame.create({
      user: testUser._id,
      game: testGame._id,
      status: "Owned",
      notes: "Love this one",
    });

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
  it("retrieves a specific user game successfully", async () => {
    const req = makeRequest(
      `http://localhost:3000/api/users/${testUser._id}/games/${testGame._id}`,
      "GET",
      undefined,
      token
    );

    const res = await GET(req, {
      params: Promise.resolve({
        id: testUser._id.toString(),
        gameId: testGame._id.toString(),
      }),
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.game.status).toBe("Owned");
    expect(data.data.game.user.username).toBe("userOne");
    expect(data.data.game.game.title).toBe("Hollow Knight");
  });

  it("returns 404 if game not found in user profile", async () => {
    const anotherGame = await Game.create({
      title: "Celeste",
      summary: "Platformer",
      genres: ["Platformer"],
      platforms: ["Switch"],
      thumbnailUrl: "",
      releaseDate: new Date("2018-01-25"),
    });

    const req = makeRequest(
      `http://localhost:3000/api/users/${testUser._id}/games/${anotherGame._id}`,
      "GET",
      undefined,
      token
    );
    const res = await GET(req, {
      params: Promise.resolve({
        id: testUser._id.toString(),
        gameId: anotherGame._id.toString(),
      }),
    });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("Game not found in user profile");
  });

  it("returns 400 for invalid user or game ID", async () => {
    const req = makeRequest(
      `http://localhost:3000/api/users/invalid-id/games/${testGame._id}`,
      "GET",
      undefined,
      token
    );
    const res = await GET(req, {
      params: Promise.resolve({ id: "invalid-id", gameId: testGame._id.toString() }),
    });
    expect(res.status).toBe(400);
  });

  it("prevents access when unauthorized", async () => {
    const req = makeRequest(
      `http://localhost:3000/api/users/${testUser._id}/games/${testGame._id}`
    );
    const res = await GET(req, {
      params: Promise.resolve({
        id: testUser._id.toString(),
        gameId: testGame._id.toString(),
      }),
    });
    expect(res.status).toBe(401);
  });

  // --PATCH--
  it("updates a user game successfully", async () => {
    const req = makeRequest(
      `http://localhost:3000/api/users/${testUser._id}/games/${testGame._id}`,
      "PATCH",
      { status: "Wishlisted", notes: "Revisiting soon" },
      token
    );

    const res = await PATCH(req, {
      params: Promise.resolve({
        id: testUser._id.toString(),
        gameId: testGame._id.toString(),
      }),
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.game.status).toBe("Wishlisted");
    expect(data.data.game.notes).toBe("Revisiting soon");
  });

  it("rejects unauthorized PATCH from another user", async () => {
    const otherToken = jwt.sign(
      { id: otherUser._id.toString(), username: otherUser.username },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    const req = makeRequest(
      `http://localhost:3000/api/users/${testUser._id}/games/${testGame._id}`,
      "PATCH",
      { status: "Blacklisted" },
      otherToken
    );

    const res = await PATCH(req, {
      params: Promise.resolve({
        id: testUser._id.toString(),
        gameId: testGame._id.toString(),
      }),
    });
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe("Unauthorized");
  });

  it("rejects invalid status", async () => {
    const req = makeRequest(
      `http://localhost:3000/api/users/${testUser._id}/games/${testGame._id}`,
      "PATCH",
      { status: "NotARealStatus" },
      token
    );
    const res = await PATCH(req, {
      params: Promise.resolve({
        id: testUser._id.toString(),
        gameId: testGame._id.toString(),
      }),
    });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Invalid status");
  });

  it("rejects notes exceeding 400 characters", async () => {
    const req = makeRequest(
      `http://localhost:3000/api/users/${testUser._id}/games/${testGame._id}`,
      "PATCH",
      { notes: "!".repeat(401) },
      token
    );
    const res = await PATCH(req, {
      params: Promise.resolve({
        id: testUser._id.toString(),
        gameId: testGame._id.toString(),
      }),
    });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/400 characters or less/);
  });

  it("rejects empty PATCH body", async () => {
    const req = makeRequest(
      `http://localhost:3000/api/users/${testUser._id}/games/${testGame._id}`,
      "PATCH",
      {},
      token
    );
    const res = await PATCH(req, {
      params: Promise.resolve({
        id: testUser._id.toString(),
        gameId: testGame._id.toString(),
      }),
    });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("No valid fields to update");
  });

  // --DELETE--
  it("deletes a user game successfully", async () => {
    const deleteGame = await Game.create({
      title: "Hades",
      summary: "Action roguelike",
      genres: ["Action"],
      platforms: ["PC"],
      thumbnailUrl: "",
      releaseDate: new Date("2020-09-17"),
    });

    await UserGame.create({
      user: testUser._id,
      game: deleteGame._id,
      status: "Owned",
    });

    const req = makeRequest(
      `http://localhost:3000/api/users/${testUser._id}/games/${deleteGame._id}`,
      "DELETE",
      undefined,
      token
    );

    const res = await DELETE(req, {
      params: Promise.resolve({
        id: testUser._id.toString(),
        gameId: deleteGame._id.toString(),
      }),
    });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Game deleted from user profile successfully");

    const check = await UserGame.findOne({
      user: testUser._id,
      game: deleteGame._id,
    });
    expect(check).toBeNull();
  });

  it("rejects delete by unauthorized user", async () => {
    const otherToken = jwt.sign(
      { id: otherUser._id.toString(), username: otherUser.username },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    const req = makeRequest(
      `http://localhost:3000/api/users/${testUser._id}/games/${testGame._id}`,
      "DELETE",
      undefined,
      otherToken
    );

    const res = await DELETE(req, {
      params: Promise.resolve({
        id: testUser._id.toString(),
        gameId: testGame._id.toString(),
      }),
    });
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 400 for invalid delete ID", async () => {
    const req = makeRequest(
      `http://localhost:3000/api/users/notvalid/games/${testGame._id}`,
      "DELETE",
      undefined,
      token
    );
    const res = await DELETE(req, {
      params: Promise.resolve({ id: "notvalid", gameId: testGame._id.toString() }),
    });
    expect(res.status).toBe(400);
  });
});
