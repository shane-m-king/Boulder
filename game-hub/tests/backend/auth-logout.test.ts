import { POST } from "@/app/api/auth/logout/route";
import { NextResponse } from "next/server";

describe("/api/auth/logout Route", () => {

  // --POST --
  it("clears token cookie and returns success", async () => {
    const response = await POST();
    const data = await response.json();

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Logged out successfully");

    const cookieHeader = response.headers.get("set-cookie");
    expect(cookieHeader).toContain("token=");
    expect(cookieHeader).toContain("Expires=");
  });
});
