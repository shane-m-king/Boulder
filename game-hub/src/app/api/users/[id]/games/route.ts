import connect from "@/dbConfig/dbConfig";
import UserGame from "@/models/userGameModel";
import { NextRequest, NextResponse } from "next/server";
import { invalidId } from "@/helpers/invalidId";
import { verifyUser } from "@/helpers/verifyUser";

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

     // Verify token and get user data - return response on failure
    const userData = verifyUser(request);
    if (userData instanceof NextResponse) return userData;

    const { searchParams } = new URL(request.url);

    // Set up pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Filter
    const search = searchParams.get("search")?.trim();
    const statusFilter = searchParams.get("status");

    // Sort results
    const sortField = searchParams.get("sortField") || "updatedAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;
    const sort: Record<string, 1 | -1> = { [sortField]: sortOrder };

    // Fetch all user games
    const userGamesRaw = await UserGame.find({ user: params.id })
      .populate("game", "-__v -createdAt -updatedAt")
      .sort(sort);

    // Apply in-memory filtering for game categories
    let filteredGames = userGamesRaw;

    if (statusFilter) {
      filteredGames = filteredGames.filter(usergame => usergame.status === statusFilter);
    }

    if (search) {
      const regex = new RegExp(search, "i");
      filteredGames = filteredGames.filter(usergame =>
        regex.test(usergame.game.title) ||
        regex.test(usergame.game.genre) ||
        regex.test(usergame.game.platform)
      );
    }

    // Pagination after filtering
    const totalGames = filteredGames.length;
    const totalPages = Math.ceil(totalGames / limit);
    const paginatedGames = filteredGames.slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      message: "Games retrieved successfully",
      data: {
        userGames: paginatedGames,
        page,
        limit,
        total: totalGames,
        totalPages,
      },
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error fetching user games: ", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch games" },
      { status: 500 }
    );
  }
};

export const POST = async (request: NextRequest, context: { params: Promise<Params> }) => {
  try {
    await connect();

    const params = await context.params;

    // Verify token and get user data - return response on failure
    const userData = verifyUser(request);
    if (userData instanceof NextResponse) return userData;
    if (userData.id !== params.id) {
      console.error("Authentication failed")
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { game, status, notes } = body;

    if (!game) {
      console.error("Game not found");
      return NextResponse.json({ success: false, error: "Game not found" }, { status: 400 });
    }

    // Check if [id] is valid ObjectID
    const idCheckFailed = invalidId(game);
    if (idCheckFailed) return idCheckFailed;

    // Prevent duplicate entries
    const existing = await UserGame.findOne({ user: params.id, game });
    if (existing) {
      console.error("Game already added");
      return NextResponse.json({ success: false, error: "Game already added to user profile" }, { status: 409 });
    }

    // Validate notes length
    if (notes && notes.length > 400) {
      console.error("Game notes are too long");
      return NextResponse.json(
        { success: false, error: "Notes must be 400 characters or less." },
        { status: 400 }
      );
    }

    // Add game to user
    const newUserGame = await UserGame.create({
      user: params.id,
      game,
      status: status || "Not Owned",
      notes: notes?.trim() || "",
    });

    const populatedUserGame = await newUserGame.populate("game", "-__v -createdAt -updatedAt");

    return NextResponse.json({
      success: true,
      message: "Game successfully added to user profile",
      data: {
        userGame: populatedUserGame,
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error("Error adding game to user profile: ", error);
    return NextResponse.json(
      { success: false, error: "Failed to add game" },
      { status: 500 }
    );
  }
};