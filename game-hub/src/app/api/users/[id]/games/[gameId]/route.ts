import connect from "@/dbConfig/dbConfig";
import UserGame from "@/models/userGameModel";
import { verifyUser } from "@/helpers/verifyUser";
import { NextRequest, NextResponse } from "next/server";
import {invalidId } from "@/helpers/invalidId";
import { STATUSES } from "@/constants/statuses";

interface Params {
  id: string;
  gameId: string;
}

export const GET = async (request: NextRequest, context: { params: Promise<Params> }) => {
  try {
    await connect();
    const params = await context.params;

    // Check if [id] is valid ObjectId
    const idCheckFailed = invalidId(params.id);
    if (idCheckFailed) return idCheckFailed;

    // Check if [gameId] is valid ObjectId
    const gameIdCheckFailed = invalidId(params.gameId);
    if (gameIdCheckFailed) return gameIdCheckFailed;

     // Verify token and get user data - return response on failure
    const userData = verifyUser(request);
    if (userData instanceof NextResponse) return userData;

    // Get game for specific user
    const userGame = await UserGame.findOne({
      user: params.id,
      game: params.gameId
    })
    
    if (!userGame) {
      console.error("Game not found");
      return NextResponse.json(
        { success: false, error: "Game not found in user profile" },
        { status: 404 }
      );
    }

    // Show user and game in response
    const populatedUserGame = await userGame.populate([
      { path: "user", select: "username" },
      { path: "game", select: "title genres platforms thumbnailUrl" }
    ]);     

    return NextResponse.json({
      success: true,
      message: "Game retrieved successfully",
      data: {
        userGame: populatedUserGame
      },
    }, { status: 200 });

  } catch (error: any) {
    console.error("Failed to retrieve game: ", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch game" },
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

    // Check if [gameId] is valid ObjectId
    const gameIdCheckFailed = invalidId(params.gameId);
    if (gameIdCheckFailed) return gameIdCheckFailed;

    // Verify token and get user data - return response on failure
    const userData = verifyUser(request);
    if (userData instanceof NextResponse) return userData;

    // Only allow user to update their own game profile
    const userGame = await UserGame.findOne({ user: params.id, game: params.gameId })

    if (!userGame) {
      console.error("Game not found");
      return NextResponse.json(
        { success: false, error: "Game not found in user profile" },
        { status: 404 }
      );
    }

    if (userData.id !== userGame.user.toString()) {
      console.error("Authentication failed");
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      ); 
    }

    const body = await request.json();
    const updates: Record<string, any> = {};

    // Validate and set status
    if (body.status !== undefined) {
        const status = body.status.trim();
      if (!STATUSES.includes(status)) {
        console.error("Invalid status");
        return NextResponse.json(
          { success: false, error: "Invalid status" },
          { status: 400 }
        );
      }
      updates.status = status;
    }

    // Validate and set notes
    if (body.notes !== undefined) {
      const notes = body.notes.trim();
      if (notes.length > 400) {
        console.error("Game notes too long");
        return NextResponse.json(
          { success: false, error: "Notes must be 400 characters or less" },
          { status: 400 }
        );
      }
      updates.notes = notes;
    }

    if (Object.keys(updates).length === 0) {
      console.error("No valid updated fields detected");
      return NextResponse.json(
        { success: false, error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Update game in user profile
    const updatedGame = await UserGame.findOneAndUpdate({ user: params.id, game: params.gameId },
      updates, {
      new: true,
    });

    if (!updatedGame) {
      console.error("Game not found");
      return NextResponse.json(
        { success: false, error: "Game not found in user profile" },
        { status: 404 }  
      )
    }

    // Show user and game in response
    const populatedGame = await updatedGame.populate([
      { path: "user", select: "username" },
      { path: "game", select: "title genres platforms" }
    ]); 

    return NextResponse.json({
      success: true,
      message: "Game updated successfully",
      data: {
        userGame: populatedGame,
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error updating game: ", error);
    return NextResponse.json(
      { success: false, error: "Failed to update game" },
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

    // Check if [gameId] is valid ObjectId
    const gameIdCheckFailed = invalidId(params.gameId);
    if (gameIdCheckFailed) return gameIdCheckFailed;

    // Verify token and get user data - return response on failure
    const userData = verifyUser(request);
    if (userData instanceof NextResponse) return userData;

    // Only allow user to delete from their own game profile
    const userGame = await UserGame.findOne({ user: params.id, game: params.gameId })

    if (!userGame) {
      console.error("Game not found");
      return NextResponse.json(
        { success: false, error: "Game not found in user profile" },
        { status: 404 }
      );
    }

    if (userData.id !== userGame.user.toString()) {
      console.error("Authentication failed");
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      ); 
    }

    // Delete game from user profile
    const deletedGame = await UserGame.findOneAndDelete({ user: params.id, game: params.gameId });

    if (!deletedGame) {
      console.error("Game not found");
      return NextResponse.json(
        { success: false, error: "Game not found to delete" },
        { status: 404 }
      );
    }

    return NextResponse.json({
        success: true,
        message: "Game deleted from user profile successfully"
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error deleting game: ", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete game from user profile" },
      { status: 500 }
    );
  }
}