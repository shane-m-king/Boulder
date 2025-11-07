import "./globals.css";
import { Orbitron, Inter } from "next/font/google";
import Navbar from "./components/Navbar";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "700"],
});

export const metadata = {
  title: "Boulder",
  description: "Track your gaming grind with Boulder.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${orbitron.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body className="font-body bg-boulder-dark text-foreground overflow-x-hidden">
        <AuthProvider>
          <div className="flex min-h-screen flex-col bg-gradient-to-br from-boulder-dark via-boulder-mid to-boulder-dark">
            <Navbar />
            <main className="flex flex-1 justify-center w-full">
              <div className="container mx-auto px-4">{children}</div>
            </main>
          </div>

          <Toaster
            position="bottom-center"
            toastOptions={{
              duration: 3000,
              style: {
                fontFamily: "Inter, sans-serif",
                fontWeight: 500,
                borderRadius: "0.75rem",
                padding: "12px 18px",
                transition: "all 0.8s ease",
              },
              className: "boulder-toast animate-toast-enter !opacity-100",
              success: {
                style: {
                  background: "#facc15",
                  color: "#0f172a",
                  border: "1px solid #fde68a",
                  boxShadow: "0 4px 12px rgba(250, 204, 21, 0.25)",
                },
                iconTheme: {
                  primary: "#0f172a",
                  secondary: "#facc15",
                },
              },
              error: {
                style: {
                  background: "#0f172a",
                  color: "#facc15",
                  border: "1px solid #facc15",
                  boxShadow: "0 4px 12px rgba(250, 204, 21, 0.25)",
                },
                iconTheme: {
                  primary: "#facc15",
                  secondary: "#0f172a",
                },
              },
              loading: {
                style: {
                  background: "linear-gradient(90deg, #0f172a, #1e293b)",
                  color: "#facc15",
                  border: "1px solid #facc15",
                  boxShadow: "0 4px 12px rgba(250, 204, 21, 0.15)",
                },
                iconTheme: {
                  primary: "#facc15",
                  secondary: "#0f172a",
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
