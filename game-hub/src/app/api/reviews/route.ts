import connect from "@/dbConfig/dbConfig";
import { NextRequest, NextResponse } from "next/server";
import Review from "@/models/reviewModel";
import { verifyUser } from "@/helpers/verifyUser";
import { invalidId } from "@/helpers/invalidId";

export const GET = async (request: NextRequest) => {
  try {
    return NextResponse.json(
      { success: false, error: "Reviews are available by game or user through the /games/id/reviews and /users/id/reviews routes"},
      { status: 404 }
    );
  } catch (error: any) {
    console.error("Error fetching API: ", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch API" },
      { status: 500 }
    );
  }
}

export const POST = async (request: NextRequest) => {
  try {
    await connect();

    // Verify token and get user data - return response on failure
    const userData = verifyUser(request);
    if (userData instanceof NextResponse) return userData;

    const body = await request.json();
    const { game, rating, title, reviewBody } = body;

    // Validate fields
    if (!game || !title || !reviewBody) {
      console.error("Missing review fields");
      return NextResponse.json(
        { success: false, error: "Review fields missing." },
        { status: 400 }
      );
    }

    // Check if [id] is valid ObjectId
    const idCheckFailed = invalidId(game);
    if (idCheckFailed) return idCheckFailed;

    // Ensure rating is within range
    if (!Number.isInteger(rating) || rating < 0 || rating > 10) {
      console.error("Invalid rating");
      return NextResponse.json(
        { success: false, error: "Rating must be 0-10." },
        { status: 400 }
      );
    }

    // Check title length
    if (title.length > 40) {
      console.error("Review title too long");
      return NextResponse.json(
        { success: false, error: "Review title maximum 40 characters" },
        { status: 400 }
      );
    }

    // Check review body length
    if (reviewBody.length > 400) {
      console.error("Review body too long");
      return NextResponse.json(
        { success: false, error: "Review body maximum 400 characters" },
        { status: 400 }
      );
    }

    // Prevent duplicate reviews from user on one game
    const existingReview = await Review.findOne({
      user: userData.id,
      game,
    });

    if (existingReview) {
      console.error("User has already reviewed this game");
      return NextResponse.json(
        { success: false, error: "User already reviewed this game." },
        { status: 409 }
      );
    }

    // Create review
    const newReview = await Review.create({
      user: userData.id,
      game,
      rating,
      title: title.trim(),
      reviewBody: reviewBody.trim(),
    });

    // Show user and game in response
    const populatedReview = await newReview.populate([
      { path: "user", select: "username" },
      { path: "game", select: "title" }
    ]);

    return NextResponse.json(
      {
        success: true,
        message: "Review created successfully.",
        data: {
          review: populatedReview
        }  
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create review." },
      { status: 500 }
    );
  }
};