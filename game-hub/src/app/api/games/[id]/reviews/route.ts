import connect from "@/dbConfig/dbConfig";
import Review from "@/models/reviewModel";
import { NextRequest, NextResponse } from "next/server";
import { invalidId } from "@/helpers/invalidId";

interface Params {
  id: string; // gameId
}

export const GET = async (
  request: NextRequest,
  context: { params: Promise<Params> }
) => {
  try {
    await connect();

    const params = await context.params;
    const { searchParams } = new URL(request.url);

    // Check if [id] is valid ObjectID
    const idCheckFailed = invalidId(params.id);
    if (idCheckFailed) return idCheckFailed;

    // Pagination
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    // Filters
    const userId = searchParams.get("user"); // filter by specific user
    const sort = searchParams.get("sort") || "-updatedAt"; // newest first

    // Build query dynamically
    const query: Record<string, any> = { game: params.id };
    if (userId) query.user = userId;

    // Fetch reviews
    const reviews = await Review.find(query)
      .populate([
        { path: "user", select: "username" },
        { path: "game", select: "title" },
      ])
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Total count for pagination
    const total = await Review.countDocuments(query);

    return NextResponse.json(
      {
        success: true,
        message: "Reviews retrieved successfully.",
        data: {
          reviews,
          total,
          page,
          totalPages: Math.ceil(total / limit),
          limit, 
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error retrieving game reviews:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch game reviews." },
      { status: 500 }
    );
  }
};