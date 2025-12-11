import { NextRequest } from "next/server";
import { GET } from "@/app/api/games/route";
import connect from "@/dbConfig/dbConfig";
import Game from "@/models/gameModel";
import mongoose from "mongoose";

const makeGetRequest = (url: string) => new NextRequest(url);

describe("/api/games Route", () => {
  
  beforeAll(async () => {
    jest.resetModules();
    await connect();

    await Game.deleteMany({});
    await Game.insertMany([
      {
        title: "Super Mario",
        summary: "A fun adventure platformer.",
        genres: ["Adventure"],
        platforms: ["Nintendo 64", "Super Nintendo Entertainment System"],
        thumbnailUrl: "",
        IGDBid: 1,
        releaseDate: new Date("1996-06-23"),
      },
      {
        title: "Stardew Valley",
        summary: "Farming and relationships.",
        genres: ["Simulation"],
        platforms: ["PC"],
        thumbnailUrl: "",
        IGDBid: 2,
        releaseDate: new Date("2016-02-26"),
      },
      {
        title: "Hearthstone",
        summary: "Collectible card game.",
        genres: ["Strategy"],
        platforms: ["PC"],
        thumbnailUrl: "",
        IGDBid: 3,
        releaseDate: new Date("2014-03-11"),
      },
    ]);
  });

  afterAll(async () => {
    await Game.deleteMany({});
    await mongoose.connection.close();
  });

  // --GET--
  it("returns a list of games", async () => {
    const req = makeGetRequest("http://localhost:3000/api/games");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.games.length).toBeGreaterThan(0);
  });

  it("filters games by search term", async () => {
    const req = makeGetRequest("http://localhost:3000/api/games?search=stardew");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.games.length).toBe(1);
    expect(data.data.games[0].title).toBe("Stardew Valley");
  });

  it("filters games by genre", async () => {
    const req = makeGetRequest("http://localhost:3000/api/games?genre=Strategy");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.games.length).toBe(1);
    expect(data.data.games[0].title).toBe("Hearthstone");
  });

  it("returns correct pagination data", async () => {
    const req = makeGetRequest("http://localhost:3000/api/games?page=1&limit=2");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.limit).toBe(2);
    expect(data.data.totalPages).toBeGreaterThanOrEqual(2);
  });
});