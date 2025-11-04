"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-boulder-dark/90 backdrop-blur-md border-b border-boulder-gold/40 text-foreground sticky top-0 z-50 w-full">
      <div className="container mx-auto flex justify-between items-center py-4 px-6">
        {/* Logo */}
        <Link
          href="/"
          className="font-display text-2xl font-bold bg-gradient-to-r from-boulder-gold to-boulder-accent bg-clip-text text-transparent tracking-widest hover:opacity-90 transition-opacity"
        >
          Boulder
        </Link>

        {/* Links */}
        <div className="flex items-center gap-6 font-body text-sm">
          <Link
            href="/games"
            className="hover:text-boulder-accent transition-colors"
          >
            Games
          </Link>

          {user ? (
            <>
              <Link
                href="/profile"
                className="hover:text-boulder-accent transition-colors"
              >
                Profile
              </Link>
              <button
                onClick={logout}
                className="bg-boulder-gold text-boulder-dark font-semibold rounded-md px-3 py-1 hover:bg-boulder-accent hover:shadow-lg transition-all"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hover:text-boulder-accent transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="bg-boulder-gold text-boulder-dark font-semibold rounded-md px-3 py-1 hover:bg-boulder-accent hover:shadow-lg transition-all"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
