import connect from "@/dbConfig/dbConfig";
import Game from "@/models/gameModel";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (request: NextRequest) => {
  try {
    await connect();

    const { searchParams } = new URL(request.url);

    // Set up pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;
    
    // Set up searching for specific games
    const search = searchParams.get("search")?.trim();
    
    // Filters
    const genre = searchParams.get("genre")?.trim();
    const platform = searchParams.get("platform")?.trim();

    const filter: Record<string, any> = {};

    if (search) {
      filter.title = { $regex: search, $options: "i" };
    }
    if (genre) {
      filter.genres = { $regex: genre, $options: "i" };
    }
    if (platform) {
      filter.platforms = { $regex: platform, $options: "i" };
    }

    // Sort results
    const sortField = searchParams.get("sortField") || "title";
    const sortOrder = searchParams.get("sortOrder") === "desc" ? -1 : 1;
    const sort: Record<string, 1 | -1> = { [sortField]: sortOrder };

    // Get games
    const games = await Game.find(filter)
      .skip(skip)
      .limit(limit)
      .sort(sort);

    const totalGames = await Game.countDocuments(filter);
    const totalPages = Math.ceil(totalGames / limit);

    return NextResponse.json({
      success: true,
      message: "Games retrieved successfully",
      data: {
        games,
        page,
        limit,
        total: totalGames,
        totalPages,
      },
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error fetching games: ", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch games" },
      { status: 500 }
    );
  }
}