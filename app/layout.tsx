import type { Metadata } from "next";
import { Sora, DM_Sans } from "next/font/google";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "InterviewIQ AI | Prepare Smarter, Get Hired",
  description: "India's first AI-powered interview preparation and candidate screening platform.",
  keywords: ["AI interview", "mock interview", "placement portal", "candidate screening", "resume parsing"],
  authors: [{ name: "InterviewIQ" }],
  openGraph: {
    title: "InterviewIQ AI | Prepare Smarter, Get Hired",
    description: "India's first AI-powered interview preparation and candidate screening platform.",
    url: "https://interview-iq-ai.onrender.com",
    siteName: "InterviewIQ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "InterviewIQ AI | Prepare Smarter, Get Hired",
    description: "India's first AI-powered interview preparation and candidate screening platform.",
  },
  /* 
  // Optionally, you can add an image by placing opengraph-image.png in the app directory
  */
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${sora.variable} ${dmSans.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
