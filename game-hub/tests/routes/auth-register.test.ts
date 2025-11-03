import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/register/route";
import connect from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import mongoose from "mongoose";

const makePostRequest = (body: any) =>
  new NextRequest("http://localhost:3000/api/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });

describe("/api/auth/register Route", () => {

  beforeAll(async () => {
    jest.resetModules();
    await connect();
    await User.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  it("creates a new user successfully", async () => {
    const req = makePostRequest({
      email: "test@example.com",
      username: "testuser",
      password: "password123",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.username).toBe("testuser");
    expect(data.data.email).toBe("test@example.com");
  });

  // --POST--
  it("rejects duplicate email registration", async () => {
    const req = makePostRequest({
      email: "test@example.com",
      username: "testuser2",
      password: "password456",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Email already in use");
  });

  it("rejects duplicate username registration", async () => {
    const req = makePostRequest({
      email: "email2@example.com",
      username: "testuser",
      password: "password789",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Username already exists");
  });

  it("rejects invalid email format", async () => {
    const req = makePostRequest({
      email: "invalid-email",
      username: "newuser",
      password: "password123",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/Invalid email address/);
  });

  it("rejects too long username", async () => {
    const req = makePostRequest({
      email: "longuser@example.com",
      username: "looooooooooooooooooooooooooooooooooooooooooooooooooooooooonguser",
      password: "passwordabc",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/Username must be at most 20 characters/);
  });

  it("rejects too short password", async () => {
    const req = makePostRequest({
      email: "shortpass@example.com",
      username: "shortuser",
      password: "pass",
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toMatch(/Password must be at least 6 characters/);
  });
});