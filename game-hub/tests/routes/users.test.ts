import { NextRequest } from "next/server";
import { GET } from "@/app/api/users/route";
import connect from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const makeRequest = (url: string, token?: string) => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Cookie = `token=${token}`;
  return new NextRequest(url, { headers });
};

describe("/api/users GET", () => {
  let testUsers: any[] = [];
  let token: string;

  beforeAll(async () => {
    jest.resetModules();
    await connect();

    await User.deleteMany({});

    // Create users
    testUsers = await User.insertMany([
      { username: "alice", email: "alice@test.com", password: "password1" },
      { username: "bob", email: "bob@test.com", password: "password2" },
      { username: "carol", email: "carol@test.com", password: "password3" },
      { username: "dave", email: "dave@test.com", password: "password4" },
      { username: "eve", email: "eve@test.com", password: "password5" },
    ]);

    // Create token for first user
    token = jwt.sign(
      { id: testUsers[0]._id.toString(), username: testUsers[0].username, email: testUsers[0].email },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  // --GET--
  it("retrieves all users", async () => {
    const req = makeRequest("http://localhost:3000/api/users", token);
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.users.length).toBe(5);
    expect(data.data.total).toBe(5);
    expect(data.data.totalPages).toBe(1);

    // Check current user flag
    const currentUser = data.data.users.find((u: any) => u.isCurrentUser);
    expect(currentUser.username).toBe("alice");
  });

  it("applies pagination correctly", async () => {
    const req = makeRequest("http://localhost:3000/api/users?page=2&limit=2", token);
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.users.length).toBe(2);
    expect(data.data.page).toBe(2);
    expect(data.data.limit).toBe(2);
    expect(data.data.total).toBe(5);
    expect(data.data.totalPages).toBe(3);
  });

  it("searches users by username", async () => {
    const req = makeRequest("http://localhost:3000/api/users?search=bo", token);
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.users.length).toBe(1);
    expect(data.data.users[0].username).toBe("bob");
  });

  it("sorts users ascending by username", async () => {
    const req = makeRequest("http://localhost:3000/api/users?sortField=username&sortOrder=asc", token);
    const res = await GET(req);
    const data = await res.json();

    const usernames = data.data.users.map((u: any) => u.username);
    expect(usernames).toEqual(["alice", "bob", "carol", "dave", "eve"]);
  });

  it("prevents access when unauthorized", async () => {
    const req = makeRequest("http://localhost:3000/api/users");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
  });
});
