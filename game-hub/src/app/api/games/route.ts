import connect from "@/dbConfig/dbConfig";
import Game from "@/models/gameModel";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (request: NextRequest) => {
  try {
    await connect();

    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const search = searchParams.get("search")?.trim();
    const genre = searchParams.get("genre")?.trim();
    const platform = searchParams.get("platform")?.trim();

    const match: Record<string, any> = {};

    if (genre) {
      match.genres = { $regex: genre, $options: "i" };
    }

    if (platform) {
      match.platforms = { $regex: platform, $options: "i" };
    }

    // Build search regex only once
    const searchRegex = search ? new RegExp(search, "i") : null;

    // ---- AGGREGATION PIPELINE ----
    const pipeline: any[] = [];

    // Apply filters
    pipeline.push({ $match: match });

    // If search is active, add scoring
    if (search) {
      pipeline.push({
        $match: { title: searchRegex }
      });

      pipeline.push({
        $addFields: {
          priority: {
            $switch: {
              branches: [
                {
                  case: { $eq: [{ $toLower: "$title" }, search.toLowerCase()] },
                  then: 0,
                },
                {
                  case: {
                    $regexMatch: {
                      input: "$title",
                      regex: new RegExp(`^${search}`, "i"),
                    },
                  },
                  then: 1,
                },
              ],
              default: 2,
            },
          },
        },
      });

      // Best sort: priority → ratingCount → title
      pipeline.push({
        $sort: {
          priority: 1,
          IGDBratingCount: -1,
          title: 1,
        },
      });
    } else {
      // If no search, default sort by popularity or title
      pipeline.push({ $sort: { IGDBratingCount: -1, title: 1 } });
    }

    // Pagination
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    // Execute pipeline
    const games = await Game.aggregate(pipeline);

    // Get total count (filters only)
    const totalGames = await Game.countDocuments(match);
    const totalPages = Math.ceil(totalGames / limit);

    return NextResponse.json(
      {
        success: true,
        message: "Games retrieved successfully",
        data: {
          games,
          page,
          limit,
          total: totalGames,
          totalPages,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching games:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch games" },
      { status: 500 }
    );
  }
};
