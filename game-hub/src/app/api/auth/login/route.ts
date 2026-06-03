import connect from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { checkRateLimit, getClientIp, AUTH_RATE_LIMIT } from "@/helpers/rateLimit";


export const POST = async (request: NextRequest) => {
  try {
    await connect();

    // Rate limit by client IP before doing any auth work
    const ip = getClientIp(request);
    const rl = await checkRateLimit(`${ip}:login`, AUTH_RATE_LIMIT);
    if (rl.limited) {
      return NextResponse.json(
        { success: false, error: "Too many login attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      );
    }

    const reqBody = await request.json();
    const { username, password } = reqBody;

    // Check for username and password
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username and password are required" },
        { status: 400 }
      );
    }

    const trimmedUsername = username.trim().toLowerCase();

    // Generic credential error avoids revealing which usernames exist
    const invalidCredentials = NextResponse.json(
      { success: false, error: "Invalid username or password" },
      { status: 401 }
    );

    // Check if username exists
    const user = await User.findOne({ username: trimmedUsername });
    if (!user) {
      return invalidCredentials;
    }

    // Check password
    const validPassword = await bcryptjs.compare(password, user.password);
    if (!validPassword) {
      return invalidCredentials;
    }

    // Create token
    const tokenData = {
      id: user._id,
      username: user.username,
      email: user.email
    }

    const token = jwt.sign(tokenData, process.env.JWT_SECRET!, {expiresIn: "24h"});

    const response = NextResponse.json({ 
      success: true, 
      message: "Login successful",
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
      }
    }, { status: 200 });
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60
    });

    return response;
        
  } catch (error: any) {
    console.error("Error logging in: ", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
};