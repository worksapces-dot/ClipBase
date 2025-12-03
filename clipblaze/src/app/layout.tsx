import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { SmoothCursor } from "@/components/ui/smooth-cursor";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ClipBlaze - AI Video Clips Generator",
    template: "%s | ClipBlaze",
  },
  description:
    "Transform long videos into viral shorts with AI. Auto captions, smart cropping, emojis, zoom effects & more. Create scroll-stopping content for TikTok, Reels & YouTube Shorts in minutes.",
  keywords: [
    "AI video editor",
    "video clips generator",
    "short form content",
    "TikTok clips",
    "YouTube Shorts",
    "Instagram Reels",
    "auto captions",
    "viral videos",
    "content repurposing",
    "video to shorts",
  ],
  authors: [{ name: "ClipBlaze" }],
  creator: "ClipBlaze",
  publisher: "ClipBlaze",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://clipblaze.com",
    siteName: "ClipBlaze",
    title: "ClipBlaze - AI Video Clips Generator",
    description:
      "Transform long videos into viral shorts with AI. Auto captions, smart cropping & more.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ClipBlaze - AI Video Clips Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ClipBlaze - AI Video Clips Generator",
    description:
      "Transform long videos into viral shorts with AI. Auto captions, smart cropping & more.",
    images: ["/og-image.png"],
    creator: "@clipblaze",
  },
  icons: {
    icon: "/icon.svg",
  },
  manifest: "/manifest.json",
  metadataBase: new URL("https://clipblaze.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased`}
      >
        <SmoothCursor />
        {children}
      </body>
    </html>
  );
}
