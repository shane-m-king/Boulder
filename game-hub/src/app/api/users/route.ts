import connect from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";
import { verifyUser } from "@/helpers/verifyUser";
import { escapeRegex } from "@/helpers/escapeRegex";
import { getPagination } from "@/helpers/pagination";

// Fields users are allowed to sort by (prevents arbitrary field injection)
const ALLOWED_SORT_FIELDS = ["createdAt", "username"];

export const GET = async (request: NextRequest) => {
  try {
    await connect();

    // Verify token and get user data - return response on failure
    const userData = verifyUser(request);
    if (userData instanceof NextResponse) return userData;
    
    const { searchParams } = new URL(request.url);

    // Set up pagination
    const { page, limit, skip } = getPagination(searchParams);

    // Set up searching for specific usernames
    const search = (searchParams.get("search") || "").trim();
    const filter = search
      ? { username: { $regex: escapeRegex(search), $options: "i" } }
      : {};

    // Sort results (fall back to default if requested field isn't allowed)
    const requestedSortField = searchParams.get("sortField") || "createdAt";
    const sortField = ALLOWED_SORT_FIELDS.includes(requestedSortField)
      ? requestedSortField
      : "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;
    const sort: Record<string, 1 | -1> = { [sortField]: sortOrder };

    // Protect emails and passwords
    const safeFields = { email: 0, password: 0 };

    // Get users
    const users = await User.find(filter, safeFields)
      .skip(skip)
      .limit(limit)
      .sort(sort);

    // Mark who is current user
    const updatedUsers = users.map((user) => ({
      ...user.toObject(),
      isCurrentUser: userData.id === user._id.toString(),
    }));

    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / limit);

    return NextResponse.json({
      success: true,
      message: "Users retrieved successfully",
      data: {
        users: updatedUsers,
        page,
        limit,
        total: totalUsers,
        totalPages,
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error fetching users: ", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch users" },
      { status: 500 }
    );
  }
};