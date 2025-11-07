import connect from "@/dbConfig/dbConfig";
import Review from "@/models/reviewModel";
import { verifyUser } from "@/helpers/verifyUser";
import { NextRequest, NextResponse } from "next/server";
import { invalidId } from "@/helpers/invalidId";

interface Params {
  id: string;
}

export const GET = async (request: NextRequest, context: { params: Promise<Params> }) => {
  try {
    await connect();

    const params = await context.params;

    // Check if [id] is valid ObjectId
    const idCheckFailed = invalidId(params.id);
    if (idCheckFailed) return idCheckFailed;

    // Get review
    const review = await Review.findById(params.id);

    if (!review) {
      console.error("Review not found");
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 }
      );
    }

     // Show user and game in response
    const populatedReview = await review.populate([
      { path: "user", select: "username" },
      { path: "game", select: "title" }
    ]);

    return NextResponse.json({
      success: true,
      message: "Review retrieved successfully",      
      data: {
        review: populatedReview
      },
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error retrieving review: ", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch review" },
      { status: 500 }
    );
  }    
}

export const PATCH = async (request: NextRequest, context: { params: Promise<Params> }) => {
  try {
    await connect();

    const params = await context.params;

    // Check if [id] is valid ObjectId
    const idCheckFailed = invalidId(params.id);
    if (idCheckFailed) return idCheckFailed;
    
    // Verify token and get user data - return response on failure
    const userData = verifyUser(request);
    if (userData instanceof NextResponse) return userData;

    // Only allow user to update their own review
    const review = await Review.findById(params.id);

    if (!review) {
      console.error("Review not found");
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 }
      );
    }

    if (userData.id !== review.user.toString()) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updates: Record<string, any> = {};

    // Validate and set rating
    if (body.rating !== undefined) {
      const rating = body.rating;
      if (rating < 0 || rating > 10) {
        console.error("Invalid rating");
        return NextResponse.json(
          { success: false, error: "Rating must be between 0 and 10" },
          { status: 400 }
        );
      }
      updates.rating = rating;
    }

    // Validate and set title
    if (body.title !== undefined) {
      const title = body.title.trim();
      if (title.length > 40) {
        console.error("Invalid title");
        return NextResponse.json(
          { success: false, error: "Review title must be 40 characters or less" },
          { status: 400 }
        );
      }
      updates.title = title;
    }

    // Validate and set review body
    if (body.reviewBody !== undefined) {
      const reviewBody = body.reviewBody.trim();
      if (reviewBody.length > 400) {
        console.error("Invalid review body");
        return NextResponse.json(
          { success: false, error: "Review body must be 400 characters or less" },
          { status: 400 }
        );
      }
      updates.reviewBody = reviewBody;
    }

    if (Object.keys(updates).length === 0) {
      console.error("No valid updated fields detected");
      return NextResponse.json(
        { success: false, error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Update review
    const updatedReview = await Review.findByIdAndUpdate(params.id, updates, {
        new: true,
    });

    if (!updatedReview) {
      console.error("Review not found");
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 }
      );
    }

     // Show user and game in response
    const populatedReview = await updatedReview.populate([
      { path: "user", select: "username" },
      { path: "game", select: "title" }
    ]);

    return NextResponse.json({
      success: true,
      message: "Review updated successfully",
      data: {
        review: populatedReview,
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error updating review: ", error);
    return NextResponse.json(
      { success: false, error: "Failed to update review" },
      { status: 500 }
    );
  }
}

export const DELETE = async (request: NextRequest, context: { params: Promise<Params> }) => {
  try {
    await connect();

    const params = await context.params;

    // Check if [id] is valid ObjectId
    const idCheckFailed = invalidId(params.id);
    if (idCheckFailed) return idCheckFailed;

    // Verify token and get user data
    const userData = verifyUser(request);
    if (userData instanceof NextResponse) return userData;

    // Only allow user to delete their own review
    const review = await Review.findById(params.id);

    if (!review) {
      console.error("Review not found");
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 }
      );
    }

    if (userData.id !== review.user.toString()) {
      console.error("Authentication failed");
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Delete Review
    const deletedReview = await Review.findOneAndDelete({ _id: params.id });

    if (!deletedReview) {
      console.error("Review not found");
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Review deleted successfully"
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error deleting review: ", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete review" },
      { status: 500 }
    );
  }
}