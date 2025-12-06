import mongoose from "mongoose";
import connect from "../dbConfig/dbConfig";
import Game from "../models/gameModel";
import * as dotenv from "dotenv";
import * as fs from "fs";
dotenv.config({ path: ".env.local" });

const IGDB_CLIENT_ID = process.env.IGDB_CLIENT_ID!;
const IGDB_ACCESS_TOKEN = process.env.IGDB_ACCESS_TOKEN!;
const TOTAL_GAMES = 345154;
const BATCH_SIZE = 50;
const CONCURRENCY = 5;
const PROGRESS_FILE = "./seedProgress.json";

// Resume tracking
function getLastBatch(): number {
  if (fs.existsSync(PROGRESS_FILE)) {
    const data = fs.readFileSync(PROGRESS_FILE, "utf-8");
    return JSON.parse(data).lastBatch || 0;
  }
  return 0;
}

function saveProgress(batchIndex: number) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ lastBatch: batchIndex }));
}

// Fetch a batch of games from IGDB
async function fetchGames(limit = 50, offset = 0) {
  const response = await fetch("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: {
      "Client-ID": IGDB_CLIENT_ID,
      Authorization: `Bearer ${IGDB_ACCESS_TOKEN}`,
    },
    body: `
      fields id, name, summary, genres.name, platforms.name,
      first_release_date, cover.url, rating, total_rating,
      total_rating_count, hypes;
      where first_release_date != null;
      sort first_release_date desc;
      limit ${limit};
      offset ${offset};
    `,
  });

  if (!response.ok) throw new Error(`IGDB API Error: ${response.statusText}`);
  return response.json();
}

// Format game
function formatGame(game: any) {
  return {
    title: game.name.trim(),
    summary: game.summary?.trim() || "No summary available.",
    genres: game.genres?.map((g: any) => g.name) || ["Unknown"],
    platforms: game.platforms?.map((p: any) => p.name) || ["Unknown"],
    thumbnailUrl: game.cover?.url
      ? game.cover.url.replace("t_thumb", "t_cover_big")
      : "",
    releaseDate: new Date(game.first_release_date * 1000),
    IGDBid: game.id ?? null,
    IGDBrating: game.rating ?? null,
    IGDBtotalRating: game.total_rating ?? null,
    IGDBratingCount: game.total_rating_count ?? null,
    IGDBhypes: game.hypes ?? null,
  };
}

// Upsert a batch to MongoDB
async function upsertBatch(batch: any[], chunkSize = 10) {
  for (let i = 0; i < batch.length; i += chunkSize) {
    const chunk = batch.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map((game) => {
        const formatted = formatGame(game);
        return Game.findOneAndUpdate(
          { IGDBid: game.id },                // unique IGDB ID
          { $set: { ...formatted, IGDBid: game.id } },
          { upsert: true, new: true }
        );
      })
    );
  }
}

async function seedGames() {
  try {
    await connect();
    console.log("Connected to MongoDB");

    const numBatches = Math.ceil(TOTAL_GAMES / BATCH_SIZE);
    let startBatch = getLastBatch();
    console.log(`Starting from batch ${startBatch + 1}/${numBatches}`);

    for (let i = startBatch; i < numBatches; i += CONCURRENCY) {
      // Build array of concurrent batch fetches
      const promises = [];
      for (let j = 0; j < CONCURRENCY && i + j < numBatches; j++) {
        const offset = (i + j) * BATCH_SIZE;
        promises.push(
          fetchGames(BATCH_SIZE, offset)
            .then((games) => upsertBatch(games))   // use optimized batch upsert
            .then(() => console.log(`Batch ${i + j + 1}/${numBatches} processed`))
        );
      }

      // Wait for all concurrent batches to finish
      await Promise.all(promises);

      // Save progress
      saveProgress(i + CONCURRENCY);

      // Small delay to avoid hitting IGDB rate limits
      await new Promise((res) => setTimeout(res, 500));
    }

    console.log(`All ${TOTAL_GAMES} games seeded successfully!`);
    if (fs.existsSync(PROGRESS_FILE)) fs.unlinkSync(PROGRESS_FILE);
  } catch (err) {
    console.error("Error seeding games:", err);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
}

seedGames();
