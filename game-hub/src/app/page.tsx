"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <section className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center text-center px-6 bg-boulder-dark text-foreground">
      <div className="max-w-2xl space-y-6">
        {/* Heading */}
        <h1 className="font-display text-4xl md:text-5xl text-boulder-gold font-bold drop-shadow-[0_0_8px_rgba(250,204,21,0.3)]">
          Welcome to Boulder V1.0!
        </h1>

        {/* Description */}
        <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
          Boulder is a full-stack game library and review hub built with{" "}
          <span className="text-boulder-accent font-medium">Next.js 14</span>,{" "}
          <span className="text-boulder-accent font-medium">TypeScript</span>,{" "}
          <span className="text-boulder-accent font-medium">TailwindCSS</span>,{" "}
          <span className="text-boulder-accent font-medium">MongoDB</span>, and{" "}
          <span className="text-boulder-accent font-medium">JWT authentication</span>.
          <br />
          <br />
          Users can securely register, log in, browse games with filters and pagination,
          add titles to personal libraries with custom statuses, and post reviews with ratings.
          Public profiles let you view other players's collections and feedback.
        </p>

        {/* Browse Button */}
        <div className="mt-4">
          <Link
            href="/games"
            className="relative inline-block bg-boulder-gold text-boulder-dark font-semibold px-6 py-3 rounded-md transition-all cursor-pointer overflow-hidden group"
          >
            <span className="relative z-10">Browse Games</span>
            {/* Glow Overlay */}
            <span className="absolute inset-0 bg-boulder-accent opacity-0 group-hover:opacity-30 transition-opacity duration-300 rounded-md"></span>
            <span className="absolute inset-0 rounded-md border border-transparent group-hover:border-boulder-gold/60 group-hover:shadow-[0_0_15px_rgba(250,204,21,0.4)] transition-all duration-300"></span>
          </Link>
        </div>

        {/* Divider */}
        <div className="border-t border-boulder-gold/20 my-6 w-3/4 mx-auto"></div>

        {/* Future Plans Section */}
        <div>
          <h2 className="font-display text-2xl text-boulder-accent mb-2">
            Plans for Future Updates:
          </h2>
          <div className="text-gray-400 italic">
            <p>Add pricing info for price comparisons across providers</p>
            <p>Add dedicated Reviews page</p>
            <p>Add friend capability</p>
          </div>
        </div>
      </div>
    </section>
  );
}

