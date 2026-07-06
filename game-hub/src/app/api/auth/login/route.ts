import connect from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { checkRateLimit, getClientIp, AUTH_RATE_LIMIT, AUTH_IP_RATE_LIMIT } from "@/helpers/rateLimit";


export const POST = async (request: NextRequest) => {
  try {
    await connect();

    const ip = getClientIp(request);

    // Coarse per-IP backstop before doing any auth work (catches username
    // enumeration across many accounts from a single IP)
    const ipLimit = await checkRateLimit(`${ip}:login`, AUTH_IP_RATE_LIMIT);
    if (ipLimit.limited) {
      return NextResponse.json(
        { success: false, error: "Too many login attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(ipLimit.retryAfter) } }
      );
    }

    const reqBody = await request.json();
    const { username, password } = reqBody;

    // Check for username and password
    if (typeof username !== "string" || typeof password !== "string" || !username || !password) {
      return NextResponse.json(
        { success: false, error: "Username and password are required" },
        { status: 400 }
      );
    }

    const trimmedUsername = username.trim().toLowerCase();

    // Fine-grained limit keyed by IP+account, so users behind a shared IP
    // don't pool attempts (key length capped: login accepts arbitrary input)
    const accountLimit = await checkRateLimit(
      `${ip}:${trimmedUsername.slice(0, 64)}:login`,
      AUTH_RATE_LIMIT
    );
    if (accountLimit.limited) {
      return NextResponse.json(
        { success: false, error: "Too many login attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(accountLimit.retryAfter) } }
      );
    }

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
    return NextResponse.json({ success: false, error: "Failed to log in" }, { status: 500 });
  }
};