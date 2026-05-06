import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "StoryForge — Where Stories Branch Infinitely",
  description:
    "The collaborative storytelling platform where every reader can become a co-author. Fork any story, write your own ending, build narrative universes together.",
  keywords: [
    "collaborative fiction",
    "story forking",
    "creative writing",
    "community storytelling",
    "narrative platform",
  ],
  openGraph: {
    title: "StoryForge — Where Stories Branch Infinitely",
    description: "Fork stories. Write your own ending. Build narrative universes.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-animated min-h-screen">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
