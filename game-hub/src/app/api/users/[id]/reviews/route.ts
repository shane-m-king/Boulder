import connect from "@/dbConfig/dbConfig";
import { NextRequest, NextResponse } from "next/server";
import { invalidId } from "@/helpers/invalidId";
import { verifyUser } from "@/helpers/verifyUser";
import { getPagination } from "@/helpers/pagination";
import Review from "@/models/reviewModel";

interface Params {
  id: string;
}

// Fields a user's reviews can be sorted by (prevents arbitrary field injection)
const ALLOWED_SORT_FIELDS = ["createdAt", "updatedAt", "rating", "title"];

  export const GET = async (request: NextRequest, context: { params: Promise<Params> }) => {
    try {
      await connect();

      const params = await context.params;
  
      // Check if [id] is valid ObjectID
      const idCheckFailed = invalidId(params.id);
      if (idCheckFailed) return idCheckFailed;

       // Verify token and get user data - return response on failure
      const userData = verifyUser(request);
      if (userData instanceof NextResponse) return userData;
  
      const { searchParams } = new URL(request.url);
  
      // Set up pagination
      const { page, limit, skip } = getPagination(searchParams);

      // Sort results (fall back to default if requested field isn't allowed)
      const requestedSortField = searchParams.get("sortField") || "createdAt";
      const sortField = ALLOWED_SORT_FIELDS.includes(requestedSortField)
        ? requestedSortField
        : "createdAt";
      const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;
      const sort: Record<string, 1 | -1> = { [sortField]: sortOrder };
  
      // Get reviews from specific user
      const reviews = await Review.find({user: params.id})
        .populate("game", "title")
        .skip(skip)
        .limit(limit)
        .sort(sort);
  
      const totalReviews = await Review.countDocuments({user: params.id});
      const totalPages = Math.ceil(totalReviews / limit);
  
      return NextResponse.json({
        success: true,
        message: "Reviews retrieved successfully",
        data: {
          reviews,
          page,
          limit,
          total: totalReviews,
          totalPages,
        },
      }, { status: 200 });
  
    } catch (error: any) {
      console.error("Error fetching reviews: ", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch reviews" },
        { status: 500 }
      );
    }
  };