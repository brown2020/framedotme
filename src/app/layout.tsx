import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ClientProvider } from "@/providers/ClientProvider";
import { COMPANY_INFO } from "@/constants/company";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: {
    default: "Frame.me - Screen Recording Made Simple",
    template: "%s | Frame.me",
  },
  description: "Create, save, and share screen recordings with ease. Professional screen recording tool for teams and individuals.",
  keywords: ["screen recording", "video capture", "screen capture", "recording tool", "frame.me"],
  authors: [{ name: COMPANY_INFO.name }],
  creator: COMPANY_INFO.name,
  publisher: COMPANY_INFO.name,
  metadataBase: new URL(COMPANY_INFO.website),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: COMPANY_INFO.website,
    title: "Frame.me - Screen Recording Made Simple",
    description: "Create, save, and share screen recordings with ease.",
    siteName: COMPANY_INFO.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "Frame.me - Screen Recording Made Simple",
    description: "Create, save, and share screen recordings with ease.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ClientProvider>
          <div className="flex flex-col h-full">
            <Header />
            <div className="flex flex-col h-container-small md:h-container-custom overflow-y-scroll flex-1">
              {children}
            </div>
          </div>
        </ClientProvider>
      </body>
    </html>
  );
}
