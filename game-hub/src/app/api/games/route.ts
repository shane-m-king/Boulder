import connect from "@/dbConfig/dbConfig";
import Game from "@/models/gameModel";
import { NextRequest, NextResponse } from "next/server";
import { escapeRegex } from "@/helpers/escapeRegex";
import { getPagination } from "@/helpers/pagination";

export const GET = async (request: NextRequest) => {
  try {
    await connect();

    const { searchParams } = new URL(request.url);

    const { page, limit, skip } = getPagination(searchParams);

    const search = searchParams.get("search")?.trim();
    const genre = searchParams.get("genre")?.trim();
    const platform = searchParams.get("platform")?.trim();

    const match: Record<string, any> = {};

    // Genre values come from a fixed dropdown of IGDB names, so an exact
    // match is safe and lets MongoDB use the genres index (regex can't)
    if (genre) {
      match.genres = genre;
    }

    if (platform) {
      match.platforms = { $regex: escapeRegex(platform), $options: "i" };
    }

    // Build search regex only once
    const searchRegex = search ? new RegExp(escapeRegex(search), "i") : null;

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
                      regex: new RegExp(`^${escapeRegex(search)}`, "i"),
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

    // Page slice and total count in a single round trip
    pipeline.push({
      $facet: {
        games: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: "count" }],
      },
    });

    const [result] = await Game.aggregate(pipeline);
    const games = result.games;
    const totalGames = result.totalCount[0]?.count ?? 0;
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
