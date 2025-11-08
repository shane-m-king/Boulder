import { NextRequest } from "next/server";
import { POST as loginPOST } from "@/app/api/auth/login/route";
import { POST as registerPOST } from "@/app/api/auth/register/route";
import connect from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import mongoose from "mongoose";

const makePostRequest = (url: string, body: any) =>
  new NextRequest(url, {
    method: "POST",
    body: JSON.stringify(body),
  });

describe("/api/auth/login Route", () => {
  beforeAll(async () => {
    jest.resetModules();
    await connect();
    await User.deleteMany({});

    // Register a test user
    const registerReq = makePostRequest(
      "http://localhost:3000/api/auth/register",
      {
        email: "username@example.com",
        username: "username",
        password: "password123",
      }
    );
    const registerRes = await registerPOST(registerReq);
    const registerData = await registerRes.json();

    expect(registerRes.status).toBe(201);
    expect(registerData.success).toBe(true);
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  // --POST--
  it("logs in successfully", async () => {
    const req = makePostRequest("http://localhost:3000/api/auth/login", {
      username: "username",
      password: "password123",
    });

    const res = await loginPOST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.username).toBe("username");
    expect(res.cookies.get("token")).toBeDefined();
  });

  it("rejects missing username", async () => {
    const req = makePostRequest("http://localhost:3000/api/auth/login", {
      password: "password123",
    });

    const res = await loginPOST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Username and password are required");
  });

  it("rejects missing password", async () => {
    const req = makePostRequest("http://localhost:3000/api/auth/login", {
      username: "username",
    });

    const res = await loginPOST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Username and password are required");
  });

  it("rejects non-existent username", async () => {
    const req = makePostRequest("http://localhost:3000/api/auth/login", {
      username: "fakeuser",
      password: "password123",
    });

    const res = await loginPOST(req);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Username not found");
  });

  it("rejects invalid password", async () => {
    const req = makePostRequest("http://localhost:3000/api/auth/login", {
      username: "username",
      password: "wrongpassword",
    });

    const res = await loginPOST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Invalid password");
  });
});
