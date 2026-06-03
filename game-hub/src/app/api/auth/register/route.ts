import connect from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import { z } from "zod";
import { checkRateLimit, getClientIp, AUTH_RATE_LIMIT } from "@/helpers/rateLimit";

// Zod schema for request body
const registerSchema = z.object({
  email: z.email({ message: "Invalid email address" }),
  username: z.string()
    .min(3, { message: "Username minimum 3 characters" })
    .max(20, { message: "Username maximum 20 characters" }),
  password: z.string()
    .min(6, { message: "Password minimum 6 characters" })
    .max(30, { message: "Password maximum 30 characters" })
});

export const POST = async (request: NextRequest) => {
  try {
    await connect();

    // Rate limit by client IP before doing any auth work
    const ip = getClientIp(request);
    const rl = await checkRateLimit(`${ip}:register`, AUTH_RATE_LIMIT);
    if (rl.limited) {
      return NextResponse.json(
        { success: false, error: "Too many registration attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      );
    }

    const reqBody = await request.json();

    // Validate request body using Zod
    const { email, username, password } = registerSchema.parse(reqBody);

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedUsername = username.trim().toLowerCase();

    // Check if email already exists
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return NextResponse.json({ success: false, error: "Email already in use" }, { status: 400 });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username: trimmedUsername });
    if (existingUser) {
      return NextResponse.json({ success: false, error: "Username already exists" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, await bcryptjs.genSalt(10));

    // Save user
    const newUser = new User({ email: normalizedEmail, username: trimmedUsername, password: hashedPassword });
    await newUser.save();

    return NextResponse.json({ 
      success: true,
      message: "User created successfully",
      data: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
      }
    }, { status: 201 });

  } catch (error: any) {
    // Zod validation errors
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(issue => issue.message).join("\n");
      console.error("Error registering user: ", errors);
      return NextResponse.json({ success: false, error: errors }, { status: 400 });
    }
    console.error("Error registering user: ", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
};