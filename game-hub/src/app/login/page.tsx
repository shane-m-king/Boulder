"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { toastAction } from "@/helpers/toastAction";

const LoginPage = () => {
  const router = useRouter();
  const { login, user, loading } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await toastAction(login(formData.username, formData.password), {
      loading: "Logging in...",
      success: "Welcome back!",
      error: (err) => err.message || "Login failed",
    });
  };

  useEffect(() => {
    if (!loading && user) {
      router.push("/profile");
    }
  }, [user, loading]);

  const buttonDisabled = !formData.username || !formData.password;

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4.1rem)] bg-gradient-to-br from-boulder-dark via-boulder-mid to-boulder-dark text-foreground">
      <div className="w-full max-w-md bg-boulder-mid/70 backdrop-blur-md shadow-2xl rounded-2xl p-8 border border-boulder-gold animate-fadeIn">
        <h1 className="text-4xl font-display font-bold text-center mb-6 tracking-wide bg-gradient-to-r from-boulder-gold to-boulder-accent bg-clip-text text-transparent uppercase">
          Welcome Back
        </h1>
        <p className="text-center text-gray-400 mb-8 font-body">
          The climb continues.
        </p>

        <form onSubmit={onLogin} className="space-y-5 font-body">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-semibold text-gray-300 mb-1 uppercase tracking-wider"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              placeholder="Your username"
              className="w-full px-4 py-2 bg-boulder-dark/70 border border-boulder-mid rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-boulder-gold"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-gray-300 mb-1 uppercase tracking-wider"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="••••••••"
              className="w-full px-4 py-2 bg-boulder-dark/70 border border-boulder-mid rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-boulder-gold"
            />
          </div>

          <button
            type="submit"
            disabled={buttonDisabled}
            className={`w-full py-2 font-display font-semibold rounded-lg transition-all uppercase tracking-wide ${
              buttonDisabled
                ? "bg-boulder-mid text-gray-400 cursor-not-allowed"
                : "bg-boulder-gold text-boulder-dark hover:bg-boulder-accent hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
            }`}
          >
            Login
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Don’t have an account?{" "}
          <Link
            href="/register"
            className="text-boulder-gold hover:text-boulder-accent font-medium"
          >
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
