import connect from "@/dbConfig/dbConfig";
import UserGame from "@/models/userGameModel";
import Game from "@/models/gameModel";
import User from "@/models/userModel";
import { Types, PipelineStage } from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { invalidId } from "@/helpers/invalidId";
import { verifyUser } from "@/helpers/verifyUser";
import { escapeRegex } from "@/helpers/escapeRegex";
import { getPagination } from "@/helpers/pagination";
import { STATUSES } from "@/constants/statuses";

interface Params {
  id: string;
}

// Fields a user library can be sorted by (prevents arbitrary field injection)
const ALLOWED_SORT_FIELDS = ["updatedAt", "createdAt", "status"];

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
    const { page, limit, skip } = getPagination(searchParams);

    // Filter
    const search = searchParams.get("search")?.trim();
    const statusFilter = searchParams.get("status");

    // Sort results (fall back to default if requested field isn't allowed)
    const requestedSortField = searchParams.get("sortField") || "updatedAt";
    const sortField = ALLOWED_SORT_FIELDS.includes(requestedSortField)
      ? requestedSortField
      : "updatedAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;
    const sort: Record<string, 1 | -1> = { [sortField]: sortOrder };

    // Filter, sort, and paginate in the database instead of loading the
    // whole library into memory
    const match: Record<string, unknown> = { user: new Types.ObjectId(params.id) };
    if (statusFilter) match.status = statusFilter;

    const pipeline: PipelineStage[] = [
      { $match: match },
      {
        $lookup: {
          from: Game.collection.name,
          localField: "game",
          foreignField: "_id",
          as: "game",
        },
      },
      { $unwind: "$game" },
    ];

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      pipeline.push({
        $match: {
          $or: [
            { "game.title": regex },
            { "game.genres": regex },
            { "game.platforms": regex },
          ],
        },
      });
    }

    // Mirror populate("game", "-__v -createdAt -updatedAt")
    pipeline.push({ $unset: ["game.__v", "game.createdAt", "game.updatedAt"] });

    // Notes are private to the library owner
    if (userData.id !== params.id) {
      pipeline.push({ $unset: "notes" });
    }

    // _id tie-break keeps pagination stable when sort values are equal
    pipeline.push({ $sort: { ...sort, _id: 1 } });
    pipeline.push({
      $facet: {
        userGames: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: "count" }],
      },
    });

    const [result] = await UserGame.aggregate(pipeline);
    const paginatedGames = result.userGames;
    const totalGames = result.totalCount[0]?.count ?? 0;
    const totalPages = Math.ceil(totalGames / limit);

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

    // Reject tokens for accounts that no longer exist (a JWT stays valid for
    // up to 24h after the account is deleted)
    const userExists = await User.exists({ _id: userData.id });
    if (!userExists) {
      console.error("Token references a deleted account");
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 }
      );
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

    // Validate status (matches the PATCH handler; otherwise Mongoose enum
    // validation would throw and surface as a 500)
    if (status !== undefined && !STATUSES.includes(status)) {
      console.error("Invalid status");
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 }
      );
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