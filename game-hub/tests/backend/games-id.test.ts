import { NextRequest } from "next/server";
import { GET } from "@/app/api/games/[id]/route";
import connect from "@/dbConfig/dbConfig";
import Game from "@/models/gameModel";
import mongoose from "mongoose";

const makeGetRequest = (url: string) => new NextRequest(url);

describe("/api/games/[id] Route", () => {
  let gameId: string;

  beforeAll(async () => {
    jest.resetModules();
    await connect();

    await Game.deleteMany({});
    const game = await Game.create({
      title: "Celeste",
      summary: "A platformer about climbing a mountain.",
      genres: ["Platformer"],
      platforms: ["PC", "Nintendo Switch"],
      thumbnailUrl: "",
      IGDBid: 1,
      releaseDate: new Date("2018-01-25"),
    });
    gameId = game._id.toString();
  });

  afterAll(async () => {
    await Game.deleteMany({});
    await mongoose.connection.close();
  });

  // --GET--
  it("returns a game by ID", async () => {
    const req = makeGetRequest(`http://localhost:3000/api/games/${gameId}`);
    const res = await GET(req, { params: Promise.resolve({ id: gameId }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.game.title).toBe("Celeste");
  });

  it("returns 404 for a non-existent ID", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const req = makeGetRequest(`http://localhost:3000/api/games/${fakeId}`);
    const res = await GET(req, { params: Promise.resolve({ id: fakeId }) });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Game not found");
  });

  it("returns 400 for invalid ObjectId", async () => {
    const invalidId = "not-a-valid-id";
    const req = makeGetRequest(`http://localhost:3000/api/games/${invalidId}`);
    const res = await GET(req, { params: Promise.resolve({ id: invalidId }) });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
  });
});