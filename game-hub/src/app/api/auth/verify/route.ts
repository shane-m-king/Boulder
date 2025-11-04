import { NextRequest, NextResponse } from "next/server";
import { verifyUser } from "@/helpers/verifyUser";

export const GET = async (request: NextRequest) => {
  try {
    const verified = verifyUser(request);
    if (verified instanceof NextResponse) return verified;
    return NextResponse.json({ success: true, message: "User verified successfully", data: { user: verified } }, { status: 200 });
  } catch (error: any) {
    console.error("Error verifying user: ", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
};
