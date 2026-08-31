import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://voicex.ai";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "VOICEX AI | Studio-Quality Neural Voiceover & Speech Synthesis",
    template: "%s | VOICEX AI",
  },
  description:
    "Transform text into studio-grade human speech in seconds. 120+ lifelike AI voices across 40+ languages with emotional nuance, timbre control, and zero-shot voice cloning.",
  keywords: [
    "AI Voiceover",
    "Text to Speech",
    "Neural Audio Synthesis",
    "Voice Cloning",
    "Fish Audio API",
    "Speech Generator",
    "Audiobook Voice Generator",
    "Podcast AI Voice",
  ],
  authors: [{ name: "VOICEX AI", url: appUrl }],
  creator: "VOICEX AI Inc.",
  publisher: "VOICEX AI Inc.",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: appUrl,
    title: "VOICEX AI | Studio-Quality Neural Voiceover Platform",
    description:
      "Transform text scripts into studio-grade voiceovers with hyper-realistic acoustic AI models. Free 1,000 credits upon sign-up.",
    siteName: "VOICEX AI",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "VOICEX AI Voiceover Platform Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VOICEX AI | Studio-Quality Neural Voiceover",
    description:
      "Generate hyper-realistic AI voiceovers with emotional control and zero-shot cloning.",
    creator: "@voicexai",
    images: ["/og-image.png"],
  },
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
};

export const viewport: Viewport = {
  themeColor: "#090d16",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "VOICEX AI",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0.00",
    priceCurrency: "USD",
  },
  description:
    "AI-powered neural voiceover generator transforming text into hyper-realistic human speech with emotion control.",
  url: appUrl,
};

export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground font-sans flex flex-col antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

