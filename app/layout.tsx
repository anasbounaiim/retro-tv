import type { Metadata } from "next";
import "@hackernoon/pixel-icon-library/fonts/iconfont.css";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://retro-tv-self.vercel.app"),
  title: "Moroccan Retro TV Experience",
  description: "Experience a Moroccan nostalgic retro TV interface",
  openGraph: {
    title: "Moroccan Retro TV Experience",
    description: "Experience a Moroccan nostalgic retro TV interface",
    url: "https://retro-tv-self.vercel.app",
    siteName: "Moroccan Retro TV Experience",
    images: [
      {
        url: "/assets/tv/tv off - Copie.png",
        width: 1200,
        height: 630,
        alt: "Moroccan Retro TV Experience",
      },
    ],
    type: "website",
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link
          as="image"
          fetchPriority="high"
          href="/assets/garage_texture_4k.png"
          rel="preload"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
