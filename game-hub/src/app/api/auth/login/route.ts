import connect from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";


export const POST = async (request: NextRequest) => {
  try {
    await connect();
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

    // Check if username already exists
    const user = await User.findOne({ username: trimmedUsername });
    if (!user) {
      return NextResponse.json({ success: false, error: "Username not found" }, { status: 404 });
    }

    // Check password
    const validPassword = await bcryptjs.compare(password, user.password);
    if (!validPassword) {
      return NextResponse.json({ success: false, error: "Invalid password" }, { status: 401 });
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