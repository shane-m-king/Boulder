import connect from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import UserGame from "@/models/userGameModel";
import Review from "@/models/reviewModel";
import { NextRequest, NextResponse } from "next/server";
import { verifyUser } from "@/helpers/verifyUser";
import { invalidId } from "@/helpers/invalidId";

interface Params {
  id: string;
}

// Protect emails and passwords
const safeFields = { email: 0, password: 0 };

export const GET = async (request: NextRequest, context: { params: Promise<Params> }) => {
  try {
    await connect();

    const params = await context.params;

    // Check if [id] is valid ObjectId
    const idCheckFailed = invalidId(params.id);
    if (idCheckFailed) return idCheckFailed;

    // Verify token and get user data - return response on failure
    const userData = verifyUser(request);
    if (userData instanceof NextResponse) return userData;

    // Get user
    const foundUser = await User.findOne({ _id: params.id }, safeFields);

    if (!foundUser) {
      console.error("User not found");
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const user = {
      ...foundUser.toObject(),
      isCurrentUser: userData.id === foundUser._id.toString(),
    };

    return NextResponse.json({
      success: true,
      message: "User retrieved successfully",     
      data: {
        user,
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error fetching user: ", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export const PATCH = async (request: NextRequest, context: { params: Promise<Params> }) => {
  try {
    await connect();

    const params = await context.params;
  
    // Check if [id] is valid ObjectID
    const idCheckFailed = invalidId(params.id);
    if (idCheckFailed) return idCheckFailed;
  
    // Verify token and get user data
    const userData = verifyUser(request);
    if (userData instanceof NextResponse) return userData;
  
    // Only allow user to update their own profile
    if (userData.id !== params.id) {
      console.error("Authentication failed")
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }
  
    const body = await request.json();
    const updates: any = {};
  
    // Validate and set username
    if (body.username !== undefined) {
      const username = body.username.trim().toLowerCase();
      if (username.length < 3 || username.length > 20) {
        console.error("Invalid username length");
        return NextResponse.json(
          { success: false, error: "Username must be 3-20 characters" },
          { status: 400 }
        );
      }
      // Reject duplicate usernames with a clean 400 (schema unique index would otherwise throw a 500)
      const existingUser = await User.findOne({ username, _id: { $ne: params.id } });
      if (existingUser) {
        console.error("Username already exists");
        return NextResponse.json(
          { success: false, error: "Username already exists" },
          { status: 400 }
        );
      }
      updates.username = username;
    }
  
    // Validate and set bio
    if (body.bio !== undefined) {
      const bio = body.bio.trim();
      if (bio.length > 200) {
        console.error("Bio length too long");
        return NextResponse.json(
          { success: false, error: "Bio must be 200 characters or less" },
          { status: 400 }
        );
      }
      updates.bio = bio;
    }
  
    if (Object.keys(updates).length === 0) {
      console.error("No valid updated fields detected");
      return NextResponse.json(
        { success: false, error: "No valid fields to update" },
        { status: 400 }
      );
    }
  
    // Update user
    const updatedUser = await User.findByIdAndUpdate(params.id, updates, {
      new: true,
      fields: safeFields,
    });
  
    if (!updatedUser) {
      console.error("User not found");
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }
  
    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      data: {
        user: {
          ...updatedUser.toObject(),
          isCurrentUser: true,
        },
      },
    }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating user: ", error);
    return NextResponse.json(
      { success: false, error: "Failed to update user" },
      { status: 500 }
    );
  }
};

export const DELETE = async (request: NextRequest, context: { params: Promise<Params> }) => {
  try {
    await connect();

    const params = await context.params;
  
    // Check if [id] is valid ObjectId
    const idCheckFailed = invalidId(params.id);
    if (idCheckFailed) return idCheckFailed;
  
    // Verify token and get user data - return response on failure
    const userData = verifyUser(request);
    if (userData instanceof NextResponse) return userData;
  
    // Only allow user to update their own profile
    if (userData.id !== params.id) {
      console.error("Authentication failed");
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Remove the user's library entries and reviews first, so a partial
    // failure can't leave orphaned documents pointing at a deleted user
    await Promise.all([
      UserGame.deleteMany({ user: params.id }),
      Review.deleteMany({ user: params.id }),
    ]);

    const deletedUser = await User.findOneAndDelete({ _id: params.id });

    if (!deletedUser) {
      console.error("User not found");
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "User deleted successfully"
    }, { status: 200 });

    // The account no longer exists — clear the auth cookie so the client
    // isn't left holding a token for a deleted user
    response.cookies.set("token", "", { httpOnly: true, expires: new Date(0) });

    return response;

  } catch (error: any) {
    console.error("Error deleting user: ", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
