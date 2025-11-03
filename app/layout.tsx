import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegistration from "./components/ServiceWorkerRegistration";
import OfflineIndicator from "./components/OfflineIndicator";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Life Moments Tracker",
  description: "Track important dates and life events with day counts. Never forget anniversaries, birthdays, or special occasions.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Life Moments Tracker",
    startupImage: "/img/icon-512-512.png",
  },
  icons: {
    icon: [
      { url: "/img/icon-48-48.png", sizes: "48x48", type: "image/png" },
      { url: "/img/icon-72-72.png", sizes: "72x72", type: "image/png" },
      { url: "/img/icon-96-96.png", sizes: "96x96", type: "image/png" },
      { url: "/img/icon-144-144.png", sizes: "144x144", type: "image/png" },
      { url: "/img/icon-192-192.png", sizes: "192x192", type: "image/png" },
      { url: "/img/icon-512-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/img/icon-192-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/img/icon-192-192.png",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "Life Moments Tracker",
    "application-name": "Life Moments Tracker",
    "msapplication-TileColor": "#6366f1",
    "msapplication-TileImage": "/img/icon-144-144.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#6366f1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ServiceWorkerRegistration />
        <OfflineIndicator />
        {children}
        <Toaster
          position="top-center"
          closeButton
          expand={false}
          visibleToasts={3}
          className="toaster"
         
        />
      </body>
    </html>
  );
}
