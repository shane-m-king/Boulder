import { NextRequest } from "next/server";
import { GET, PATCH, DELETE } from "@/app/api/users/[id]/route";
import connect from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const makeRequest = (
  url: string,
  method: string = "GET",
  body?: any,
  token?: string
) => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Cookie = `token=${token}`;

  return new NextRequest(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
};

describe("/api/users/[id] Route", () => {
  let testUser: any;
  let otherUser: any;
  let token: string;

  beforeAll(async () => {
    jest.resetModules();
    await connect();
    await User.deleteMany({});

    // Create users
    testUser = await User.create({
      username: "targetUser",
      email: "target@test.com",
      password: "password123",
      bio: "Initial bio",
    });

    otherUser = await User.create({
      username: "otherUser",
      email: "other@test.com",
      password: "password123",
    });

    // Token for first user
    token = jwt.sign(
      {
        id: testUser._id.toString(),
        username: testUser.username,
        email: testUser.email,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  // --GET--
  it("retrieves a user successfully", async () => {
    const req = makeRequest(
      `http://localhost:3000/api/users/${testUser._id}`,
      "GET",
      undefined,
      token
    );

    const res = await GET(req, { params: Promise.resolve({ id: testUser._id.toString() }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.user.username).toBe("targetUser");
    expect(data.data.user.isCurrentUser).toBe(true);
    expect(data.data.user).not.toHaveProperty("password");
    expect(data.data.user).not.toHaveProperty("email");
  });

  it("returns 404 if user not found", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const req = makeRequest(
      `http://localhost:3000/api/users/${fakeId}`,
      "GET",
      undefined,
      token
    );

    const res = await GET(req, { params: Promise.resolve({ id: fakeId.toString() }) });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe("User not found");
  });

  it("returns 400 for invalid ID", async () => {
    const req = makeRequest("http://localhost:3000/api/users/invalid-id", "GET", undefined, token);
    const res = await GET(req, { params: Promise.resolve({ id: "invalid-id" }) });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Invalid ID");
  });

  it("prevents access when unauthorized", async () => {
    const req = makeRequest(`http://localhost:3000/api/users/${testUser._id}`);
    const res = await GET(req, { params: Promise.resolve({ id: testUser._id.toString() }) });
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
  });

  // --PATCH--
  it("updates a user successfully", async () => {
    const req = makeRequest(
      `http://localhost:3000/api/users/${testUser._id}`,
      "PATCH",
      { username: "updatedUser", bio: "Updated bio" },
      token
    );

    const res = await PATCH(req, { params: Promise.resolve({ id: testUser._id.toString() }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.user.username).toBe("updatedUser");
    expect(data.data.user.bio).toBe("Updated bio");
    expect(data.data.user.isCurrentUser).toBe(true);
  });

  it("rejects updates from unauthorized user", async () => {
    const otherToken = jwt.sign(
      {
        id: otherUser._id.toString(),
        username: otherUser.username,
        email: otherUser.email,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    const req = makeRequest(
      `http://localhost:3000/api/users/${testUser._id}`,
      "PATCH",
      { username: "unauthorizedChange" },
      otherToken
    );

    const res = await PATCH(req, { params: Promise.resolve({ id: testUser._id.toString() }) });
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Unauthorized");
  });

  it("rejects invalid username", async () => {
    const req = makeRequest(
      `http://localhost:3000/api/users/${testUser._id}`,
      "PATCH",
      { username: "a" },
      token
    );

    const res = await PATCH(req, { params: Promise.resolve({ id: testUser._id.toString() }) });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Username must be 3-20 characters");
  });

  it("rejects too-long bio", async () => {
    const req = makeRequest(
      `http://localhost:3000/api/users/${testUser._id}`,
      "PATCH",
      { bio: "a".repeat(201) },
      token
    );

    const res = await PATCH(req, { params: Promise.resolve({ id: testUser._id.toString() }) });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Bio must be 200 characters or less");
  });

  it("rejects empty body update", async () => {
    const req = makeRequest(
      `http://localhost:3000/api/users/${testUser._id}`,
      "PATCH",
      {},
      token
    );

    const res = await PATCH(req, { params: Promise.resolve({ id: testUser._id.toString() }) });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("No valid fields to update");
  });

  // --DELETE--
  it("deletes user successfully", async () => {
    const userToDelete = await User.create({
      username: "deleteUser",
      email: "delete@test.com",
      password: "password123",
    });

    const deleteToken = jwt.sign(
      {
        id: userToDelete._id.toString(),
        username: userToDelete.username,
        email: userToDelete.email,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    const req = makeRequest(
      `http://localhost:3000/api/users/${userToDelete._id}`,
      "DELETE",
      undefined,
      deleteToken
    );

    const res = await DELETE(req, { params: Promise.resolve({ id: userToDelete._id.toString() }) });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("User deleted successfully");

    const check = await User.findById(userToDelete._id);
    expect(check).toBeNull();
  });

  it("rejects delete by another user", async () => {
    const userToDelete = await User.create({
      username: "protectedUser",
      email: "protected@test.com",
      password: "password123",
    });

    const req = makeRequest(
      `http://localhost:3000/api/users/${userToDelete._id}`,
      "DELETE",
      undefined,
      token
    );

    const res = await DELETE(req, { params: Promise.resolve({ id: userToDelete._id.toString() }) });
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 400 for invalid delete ID", async () => {
    const req = makeRequest("http://localhost:3000/api/users/notvalid", "DELETE", undefined, token);
    const res = await DELETE(req, { params: Promise.resolve({ id: "notvalid" }) });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Invalid ID");
  });
});
